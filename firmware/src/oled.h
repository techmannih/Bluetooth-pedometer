#ifndef PEDOMETER_OLED_H
#define PEDOMETER_OLED_H
#include "core.h"
enum oled_pin { OLED_POWER, OLED_RESET, OLED_DC, OLED_CS };
struct oled_io {
    int (*pin)(enum oled_pin pin, bool high);
    int (*write)(const uint8_t *data, size_t size);
    int (*sleep_pins)(void);
    void (*delay_ms)(uint32_t ms);
};
struct oled { const struct oled_io *io; uint8_t height; bool active; };
int oled_init(struct oled *o, const struct oled_io *io, uint8_t height);
int oled_off(struct oled *o);
int oled_text(struct oled *o, const char *a, const char *b, const char *c, const char *d);
int oled_status(struct oled *o, const struct telemetry *t, bool connected);
#endif
