#ifndef PEDOMETER_PMIC_H
#define PEDOMETER_PMIC_H
#include "bus.h"
#include <stdbool.h>
#define PMIC_ADDR 0x6b
struct charge_profile {
    bool approved;
    uint32_t current_ua, precharge_ua;
    uint8_t termination_percent, ts_cold, ts_cool, ts_warm, ts_hot;
};
int pmic_setup(const struct reg_bus *b, const struct charge_profile *p);
int pmic_verify(const struct reg_bus *b, const struct charge_profile *p);
int pmic_allow_charge(const struct reg_bus *b, bool enable);
int pmic_ship(const struct reg_bus *b);
#endif
