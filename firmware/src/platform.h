#ifndef PEDOMETER_PLATFORM_H
#define PEDOMETER_PLATFORM_H
#include "bus.h"
#include "oled.h"
#include <zephyr/kernel.h>
extern const struct reg_bus board_bus;
extern const struct oled_io board_oled;
extern struct k_sem app_wake;
int board_init(void);
int board_pmic_wake(bool awake);
int board_inhibit(bool inhibit);
int board_button(void);
int board_usb_present(void);
void board_feed(void);
void board_bus_recover(void);
void board_reboot(void);
#endif
