#include "oled.h"
#include <errno.h>
#include <stdio.h>
#include <string.h>
/* Five columns, least-significant bit at top. Small built-in uppercase font. */
static const uint8_t digits[10][5] = {
    {62,81,73,69,62},{0,66,127,64,0},{66,97,81,73,70},{33,65,69,75,49},
    {24,20,18,127,16},{39,69,69,69,57},{60,74,73,73,48},{1,113,9,5,3},
    {54,73,73,73,54},{6,73,73,41,30}
};
static const uint8_t letters[26][5] = {
    {126,17,17,17,126},{127,73,73,73,54},{62,65,65,65,34},{127,65,65,34,28},
    {127,73,73,73,65},{127,9,9,9,1},{62,65,73,73,122},{127,8,8,8,127},
    {0,65,127,65,0},{32,64,65,63,1},{127,8,20,34,65},{127,64,64,64,64},
    {127,2,12,2,127},{127,4,8,16,127},{62,65,65,65,62},{127,9,9,9,6},
    {62,65,81,33,94},{127,9,25,41,70},{38,73,73,73,50},{1,1,127,1,1},
    {63,64,64,64,63},{31,32,64,32,31},{127,32,24,32,127},{99,20,8,20,99},
    {3,4,120,4,3},{97,81,73,69,67}
};
static void glyph(char c, uint8_t out[5])
{
    memset(out, 0, 5);
    if (c >= '0' && c <= '9') { memcpy(out, digits[c-'0'], 5); }
    else if (c >= 'A' && c <= 'Z') { memcpy(out, letters[c-'A'], 5); }
    else if (c == '.') { out[2] = 96; }
    else if (c == ':') { out[2] = 54; }
    else if (c == '-') { memset(out, 8, 5); }
    else if (c == '%') { out[0]=99; out[1]=19; out[2]=8; out[3]=100; out[4]=99; }
    else if (c == '?') { out[0]=2; out[1]=1; out[2]=81; out[3]=9; out[4]=6; }
}
static int transfer(struct oled *o, bool data, const uint8_t *buf, size_t n)
{
    int rc = o->io->pin(OLED_DC, data);
    if (!rc) { rc = o->io->pin(OLED_CS, false); }
    if (!rc) { rc = o->io->write(buf, n); }
    int deselect = o->io->pin(OLED_CS, true);
    return rc ? rc : deselect;
}
int oled_off(struct oled *o)
{
    int rc = 0;
    if (o->active) { const uint8_t cmd = 0xae; rc = transfer(o, false, &cmd, 1); }
    int r = o->io->sleep_pins(); if (!rc) { rc = r; }
    for (enum oled_pin p = OLED_RESET; p <= OLED_CS; ++p) {
        r = o->io->pin(p, false); if (!rc) { rc = r; }
    }
    r = o->io->pin(OLED_POWER, false); if (!rc) { rc = r; }
    o->active = false;
    return rc;
}
int oled_init(struct oled *o, const struct oled_io *io, uint8_t height)
{
    if (height != 32 && height != 64) { return -EINVAL; }
    *o = (struct oled){.io = io, .height = height};
    return oled_off(o);
}
static int power_on(struct oled *o)
{
    if (o->active) { return 0; }
    int rc = oled_off(o);
    if (!rc) { rc = o->io->pin(OLED_POWER, true); }
    if (rc) { return rc; }
    o->io->delay_ms(20);
    rc = o->io->pin(OLED_RESET, true);
    o->io->delay_ms(10);
    if (rc) { oled_off(o); return rc; }
    o->active = true;
    uint8_t cmd[] = {0xae,0xd5,0x80,0xa8,o->height-1,0xd3,0,0x40,
        0x8d,0x14,0x20,0,0xa1,0xc8,0xda,o->height == 64 ? 0x12 : 0x02,
        0x81,0x3f,0xd9,0xf1,0xdb,0x40,0xa4,0xa6,0x2e};
    rc = transfer(o, false, cmd, sizeof(cmd));
    if (rc) { oled_off(o); }
    return rc;
}
int oled_text(struct oled *o, const char *a, const char *b, const char *c, const char *d)
{
    int rc = power_on(o); if (rc) { return rc; }
    uint8_t page[128]; const char *lines[4] = {a,b,c,d};
    uint8_t cmd[] = {0x21,0,127,0x22,0,o->height/8-1};
    rc = transfer(o, false, cmd, sizeof(cmd));
    for (unsigned p = 0; p < o->height / 8u && !rc; ++p) {
        memset(page, 0, sizeof(page));
        unsigned spacing = o->height / 32u;
        const char *s = p % spacing ? "" : lines[p / spacing];
        for (unsigned col = 0; col < 21 && s[col]; ++col) { glyph(s[col], page+col*6); }
        rc = transfer(o, true, page, sizeof(page));
    }
    if (!rc) { const uint8_t on = 0xaf; rc = transfer(o, false, &on, 1); }
    if (rc) { oled_off(o); }
    return rc;
}
int oled_status(struct oled *o, const struct telemetry *t, bool connected)
{
    char a[22], b[22], c[22];
    snprintf(a, sizeof(a), "STEPS %lu", (unsigned long)t->steps);
    snprintf(b, sizeof(b), "KM %lu.%03lu", (unsigned long)(t->distance_mm/1000000u),
        (unsigned long)(t->distance_mm/1000u%1000u));
    if (!(t->flags & STATUS_BATTERY)) { snprintf(c, sizeof(c), "BATTERY ABSENT"); }
    else if (t->flags & STATUS_SOC) { snprintf(c, sizeof(c), "BAT %u%% %uMV", t->percent, t->millivolts); }
    else { snprintf(c, sizeof(c), "BAT %uMV SOC ?", t->millivolts); }
    const char *state = !(t->flags & STATUS_MOTION) ? "SENSOR ERROR" :
        (t->flags & STATUS_STORAGE_ERROR) ? "SAVE ERROR" :
        connected ? "BLUETOOTH CONNECTED" : "HOLD 2-5S TO PAIR";
    return oled_text(o, a, b, c, state);
}
