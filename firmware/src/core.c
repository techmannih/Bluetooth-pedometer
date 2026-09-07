#include "core.h"
#include <errno.h>
#include <limits.h>

bool steps_sample(struct step_state *s, uint32_t raw, uint64_t now, bool reset)
{
    raw &= 0xffffffu;
    if (!s->initialized || reset) {
        s->raw = raw; s->sample_ms = now; s->initialized = true;
        return true;
    }
    if (now < s->sample_ms) { return false; }
    uint32_t delta = (raw - s->raw) & 0xffffffu;
    uint64_t limit = (now - s->sample_ms) / 1000u * 8u + 16u;
    s->raw = raw; s->sample_ms = now;
    if (delta > limit) { return false; }
    s->total = UINT32_MAX - s->total < delta ? UINT32_MAX : s->total + delta;
    return true;
}
uint32_t steps_distance(uint32_t count, uint16_t stride)
{
    uint64_t mm = (uint64_t)count * stride;
    return mm > UINT32_MAX ? UINT32_MAX : (uint32_t)mm;
}
enum action button_action(uint64_t ms)
{
    if (ms < 40) { return ACTION_NONE; }
    if (ms < 2000) { return ACTION_SHOW; }
    if (ms < 5000) { return ACTION_PAIR; }
    if (ms < 8000) { return ACTION_RESET; }
    return ACTION_SHIP;
}
bool clock_sync(struct app_clock *c, uint32_t seconds, int16_t zone, uint64_t now)
{
    if (seconds < 1577836800u || zone < -720 || zone > 840) { return false; }
    c->unix_seconds = seconds; c->timezone = zone; c->sync_ms = now;
    c->day = ((int64_t)seconds + zone * 60) / 86400;
    c->valid = true;
    return true;
}
bool clock_new_day(struct app_clock *c, uint64_t now)
{
    if (!c->valid || now < c->sync_ms) { return false; }
    int64_t day = ((int64_t)c->unix_seconds + (now - c->sync_ms) / 1000u +
                   (int64_t)c->timezone * 60) / 86400;
    if (day <= c->day) { return false; }
    c->day = day;
    return true;
}
static void le16(uint8_t *d, uint16_t v) { d[0] = v; d[1] = v >> 8; }
static void le32(uint8_t *d, uint32_t v)
{ le16(d, v); le16(d + 2, v >> 16); }
void telemetry_encode(const struct telemetry *t, uint8_t out[20])
{
    le32(out, t->steps); le32(out + 4, t->distance_mm);
    le32(out + 8, t->uptime_s); le16(out + 12, t->millivolts);
    out[14] = t->percent; out[15] = t->flags;
    le16(out + 16, t->stride_mm); out[18] = t->activity; out[19] = 1;
}
int command_decode(const uint8_t *d, size_t n, struct command *out)
{
    *out = (struct command){0};
    if (!n) { return -EINVAL; }
    switch (d[0]) {
    case 1: if (n != 1) { return -EINVAL; } out->action = ACTION_SHOW; break;
    case 2: if (n != 1) { return -EINVAL; } out->action = ACTION_RESET; break;
    case 3: if (n != 1) { return -EINVAL; } out->action = ACTION_SHIP; break;
    case 4:
        if (n != 3) { return -EINVAL; }
        out->value = d[1] | (uint16_t)d[2] << 8;
        if (out->value < 100 || out->value > 2000) { return -ERANGE; }
        out->action = ACTION_STRIDE; break;
    case 5:
        if (n != 7) { return -EINVAL; }
        out->value = d[1] | (uint32_t)d[2] << 8 | (uint32_t)d[3] << 16 | (uint32_t)d[4] << 24;
        out->timezone = (int16_t)(d[5] | (uint16_t)d[6] << 8);
        if (out->value < 1577836800u || out->timezone < -720 || out->timezone > 840) { return -ERANGE; }
        out->action = ACTION_TIME; break;
    default: return -ENOTSUP;
    }
    return 0;
}
