#ifndef PEDOMETER_BLE_H
#define PEDOMETER_BLE_H
#include "core.h"
int ble_start(void);
void ble_poll(uint64_t now);
void ble_publish(const struct telemetry *t);
void ble_pair_window(uint64_t until);
void ble_cancel_pairing(void);
bool ble_connected(void);
bool ble_command_get(struct command *cmd);
void ble_stop(void);
#endif
