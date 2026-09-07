#include "gauge.h"
#include <errno.h>
#include <string.h>
#define GAUGE_ADDR 0x55
static int read_word(const struct reg_bus *b, uint8_t r, uint16_t *value)
{
    uint8_t d[2]; int rc = b->read(b->ctx, GAUGE_ADDR, r, d, 2);
    if (!rc) { *value = d[0] | (uint16_t)d[1] << 8; }
    b->delay_ms(b->ctx, 1); return rc;
}
static int control(const struct reg_bus *b, uint16_t cmd)
{
    uint8_t d[2] = {cmd & 0xff, cmd >> 8};
    int rc = b->write(b->ctx, GAUGE_ADDR, 0, d, 2);
    b->delay_ms(b->ctx, 5); return rc;
}
static int control_read(const struct reg_bus *b, uint16_t cmd, uint16_t *v)
{ int rc = control(b, cmd); return rc ? rc : read_word(b, 0, v); }
static int cfg_wait(const struct reg_bus *b, bool enabled)
{
    for (unsigned i = 0; i < 20; ++i) {
        uint16_t flags; int rc = read_word(b, 0x06, &flags);
        if (rc) { return rc; }
        if (!!(flags & 0x10) == enabled) { return 0; }
        b->delay_ms(b->ctx, 100);
    }
    return -ETIMEDOUT;
}
static uint8_t checksum(const uint8_t d[32])
{ uint8_t sum = 0; for (unsigned i = 0; i < 32; ++i) { sum += d[i]; } return 255u - sum; }
static void put_be16(uint8_t *d, uint16_t v) { d[0] = v >> 8; d[1] = v; }
int gauge_configure(const struct reg_bus *b, const struct gauge_profile *p)
{
    uint16_t id; int rc = control_read(b, 0x0001, &id);
    if (rc || id != 0x0427) { return rc ? rc : -ENODEV; }
    uint32_t energy = (uint32_t)p->capacity_mah * p->nominal_mv / 1000;
    if (p->capacity_mah < 100 || energy > 32767 || p->nominal_mv < 3600 ||
        p->nominal_mv > 3800 || p->cutoff_mv < 3000 || p->cutoff_mv > 3500 ||
        !p->taper_rate || p->taper_rate > 2000) { return -EINVAL; }
    /* Factory key only. A changed key is not bypassed. Always reseal on failure. */
    if ((rc = control(b, 0x8000)) || (rc = control(b, 0x8000))) { goto seal_only; }
    if ((rc = control(b, 0x0013)) || (rc = cfg_wait(b, true))) { goto exit_cfg; }
    if ((rc = control(b, 0x0031)) || /* CHEM_B: 1202, 4.2 V Li-ion */
        (rc = reg_write8(b, GAUGE_ADDR, 0x61, 0)) ||
        (rc = reg_write8(b, GAUGE_ADDR, 0x3e, 82)) ||
        (rc = reg_write8(b, GAUGE_ADDR, 0x3f, 0))) { goto exit_cfg; }
    b->delay_ms(b->ctx, 10);
    uint8_t data[32], verify[32], sum;
    if ((rc = b->read(b->ctx, GAUGE_ADDR, 0x40, data, 32)) ||
        (rc = reg_read8(b, GAUGE_ADDR, 0x60, &sum))) { goto exit_cfg; }
    if (sum != checksum(data)) { rc = -EIO; goto exit_cfg; }
    put_be16(data + 6, p->capacity_mah); put_be16(data + 8, energy);
    put_be16(data + 10, p->cutoff_mv); put_be16(data + 21, p->taper_rate);
    put_be16(data + 29, 4100);
    if ((rc = b->write(b->ctx, GAUGE_ADDR, 0x40, data, 32)) ||
        (rc = reg_write8(b, GAUGE_ADDR, 0x60, checksum(data)))) { goto exit_cfg; }
    b->delay_ms(b->ctx, 10);
    if ((rc = b->read(b->ctx, GAUGE_ADDR, 0x40, verify, 32)) ||
        (rc = reg_read8(b, GAUGE_ADDR, 0x60, &sum))) { goto exit_cfg; }
    if (memcmp(data, verify, 32) || sum != checksum(verify)) { rc = -EIO; }
exit_cfg:;
    int cleanup = control(b, 0x0042);
    if (!cleanup) { cleanup = cfg_wait(b, false); }
    if (!rc) { rc = cleanup; }
seal_only:;
    int seal = control(b, 0x0020);
    if (rc || seal) { return rc ? rc : seal; }
    b->delay_ms(b->ctx, 2000);
    rc = control_read(b, 0x0008, &id);
    return rc ? rc : id == 1202 ? 0 : -EIO;
}
int gauge_read(const struct reg_bus *b, bool configured, struct battery_reading *out)
{
    *out = (struct battery_reading){.percent = 255};
    uint16_t flags, soc; int rc = read_word(b, 0x04, &out->millivolts);
    if (rc) { return rc; }
    if (out->millivolts < 2000 || out->millivolts > 4600) { return -ERANGE; }
    if ((rc = read_word(b, 0x06, &flags))) { return rc; }
    if (configured && (flags & 0x20)) { return -EAGAIN; } /* ITPOR: restore profile */
    if (!configured || (flags & 0x10) || !(flags & 0x08)) { return 0; }
    if ((rc = read_word(b, 0x1c, &soc))) { return rc; }
    if (soc > 100) { return -ERANGE; }
    out->percent = soc; out->soc_valid = true; return 0;
}
