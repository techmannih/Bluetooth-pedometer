#ifndef PEDOMETER_GAUGE_H
#define PEDOMETER_GAUGE_H
#include "bus.h"
#include <stdbool.h>
struct gauge_profile { uint16_t capacity_mah, nominal_mv, cutoff_mv, taper_rate; };
struct battery_reading { uint16_t millivolts; uint8_t percent; bool soc_valid; };
int gauge_configure(const struct reg_bus *b, const struct gauge_profile *p);
int gauge_read(const struct reg_bus *b, bool configured, struct battery_reading *out);
#endif
