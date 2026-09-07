#ifndef PEDOMETER_MOTION_H
#define PEDOMETER_MOTION_H
#include "bus.h"
#include "bma400.h"
#include <stdbool.h>
struct motion { struct bma400_dev dev; const struct reg_bus *bus; };
int motion_init(struct motion *m, const struct reg_bus *b, bool wrist, bool *reset);
int motion_read(struct motion *m, uint32_t *steps, uint8_t *activity);
#endif
