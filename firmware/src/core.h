#ifndef PEDOMETER_CORE_H
#define PEDOMETER_CORE_H
#include <stdbool.h>
#include <stdint.h>
#include <stddef.h>
enum action { ACTION_NONE, ACTION_SHOW, ACTION_PAIR, ACTION_RESET, ACTION_SHIP,
              ACTION_STRIDE, ACTION_TIME, ACTION_PASSKEY, ACTION_PAIR_DONE };
struct command { enum action action; uint32_t value; int16_t timezone; };
struct step_state {
    uint32_t total, raw;
    uint64_t sample_ms;
    bool initialized;
};
struct app_clock {
    uint32_t unix_seconds;
    uint64_t sync_ms;
    int16_t timezone;
    int64_t day;
    bool valid;
};
enum status_flag {
    STATUS_MOTION = 1, STATUS_PMIC = 2, STATUS_BATTERY = 4,
    STATUS_SOC = 8, STATUS_CHARGE_ENABLED = 16, STATUS_TIME = 32,
    STATUS_STORAGE_ERROR = 64, STATUS_SAMPLE_GAP = 128
};
struct telemetry {
    uint32_t steps, distance_mm, uptime_s;
    uint16_t millivolts, stride_mm;
    uint8_t percent, flags, activity;
};
bool steps_sample(struct step_state *s, uint32_t raw, uint64_t now, bool reset);
uint32_t steps_distance(uint32_t count, uint16_t stride);
enum action button_action(uint64_t held_ms);
bool clock_sync(struct app_clock *c, uint32_t unix_seconds, int16_t timezone, uint64_t now);
bool clock_new_day(struct app_clock *c, uint64_t now);
void telemetry_encode(const struct telemetry *t, uint8_t out[20]);
int command_decode(const uint8_t *data, size_t size, struct command *out);
#endif
