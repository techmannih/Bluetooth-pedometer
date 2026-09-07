#include "pmic.h"
#include <errno.h>

static int valid(const struct charge_profile *p)
{
    if (!p->approved) { return 0; }
    return p->current_ua >= 5000 && p->current_ua <= 50000 &&
        p->current_ua % 1250 == 0 && p->precharge_ua >= 1250 &&
        p->precharge_ua <= p->current_ua && p->precharge_ua <= 38750 &&
        p->precharge_ua % 1250 == 0 && p->termination_percent >= 1 &&
        p->termination_percent <= 31 &&
        p->current_ua * p->termination_percent / 100 >= 500 &&
        p->ts_cold > p->ts_cool && p->ts_cool > p->ts_warm &&
        p->ts_warm > p->ts_hot && p->ts_hot > 0 ? 0 : -EINVAL;
}
static size_t settings(const struct charge_profile *p, uint8_t r[][2])
{
    size_t n = 0;
    r[n][0] = 0x1d; r[n++][1] = 0xe0; /* enabled 3.0 V LDO */
    r[n][0] = 0x19; r[n++][1] = 0x01; /* independent 100 mA input limit */
    r[n][0] = 0x17; r[n++][1] = 0xc2; /* HOT/COLD, 6 h timer, 50 s watchdog */
    /* Leave MR at reset/restart default: application checkpoints before ship. */
    if (p->approved) {
        r[n][0] = 0x12; r[n++][1] = 60; /* 4.2 V only */
        r[n][0] = 0x13; r[n++][1] = p->current_ua / 1250;
        r[n][0] = 0x14; r[n++][1] = p->precharge_ua / 1250; /* range=0 */
        r[n][0] = 0x15; r[n++][1] = p->termination_percent << 1;
        r[n][0] = 0x62; r[n++][1] = p->ts_cold;
        r[n][0] = 0x63; r[n++][1] = p->ts_cool;
        r[n][0] = 0x64; r[n++][1] = p->ts_warm;
        r[n][0] = 0x65; r[n++][1] = p->ts_hot;
    }
    return n;
}
int pmic_setup(const struct reg_bus *b, const struct charge_profile *p)
{
    uint8_t id, regs[11][2];
    int rc = valid(p);
    if (rc) { return rc; }
    rc = reg_read8(b, PMIC_ADDR, 0x6f, &id);
    if (rc || id != 0x20) { return rc ? rc : -ENODEV; }
    rc = pmic_allow_charge(b, false);
    if (rc) { return rc; }
    size_t n = settings(p, regs);
    for (size_t i = 0; i < n; ++i) {
        rc = reg_write_checked(b, PMIC_ADDR, regs[i][0], regs[i][1]);
        if (rc) { return rc; }
    }
    b->delay_ms(b->ctx, 10);
    return pmic_verify(b, p);
}
int pmic_verify(const struct reg_bus *b, const struct charge_profile *p)
{
    uint8_t regs[11][2], v;
    int rc = valid(p);
    if (rc) { return rc; }
    size_t n = settings(p, regs);
    for (size_t i = 0; i < n; ++i) {
        rc = reg_read8(b, PMIC_ADDR, regs[i][0], &v);
        if (rc || v != regs[i][1]) { return rc ? rc : -EIO; }
    }
    return 0;
}
int pmic_allow_charge(const struct reg_bus *b, bool enable)
{
    uint8_t v;
    int rc = reg_read8(b, PMIC_ADDR, 0x37, &v);
    return rc ? rc : reg_write_checked(b, PMIC_ADDR, 0x37,
        enable ? v & (uint8_t)~1u : v | 1u);
}
int pmic_ship(const struct reg_bus *b)
{
    uint8_t v;
    int rc = reg_read8(b, PMIC_ADDR, 0x35, &v);
    return rc ? rc : reg_write8(b, PMIC_ADDR, 0x35, (v & 0x34u) | 0x80u);
}
