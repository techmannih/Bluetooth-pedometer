#ifndef PEDOMETER_BUS_H
#define PEDOMETER_BUS_H
#include <stddef.h>
#include <stdint.h>
struct reg_bus {
    int (*read)(void *, uint8_t, uint8_t, uint8_t *, size_t);
    int (*write)(void *, uint8_t, uint8_t, const uint8_t *, size_t);
    void (*delay_ms)(void *, uint32_t);
    void *ctx;
};
int reg_read8(const struct reg_bus *b, uint8_t addr, uint8_t reg, uint8_t *v);
int reg_write8(const struct reg_bus *b, uint8_t addr, uint8_t reg, uint8_t v);
int reg_write_checked(const struct reg_bus *b, uint8_t addr, uint8_t reg, uint8_t v);
#endif
