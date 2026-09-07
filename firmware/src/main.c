#include "ble.h"
#include "core.h"
#include "gauge.h"
#include "motion.h"
#include "oled.h"
#include "platform.h"
#include "pmic.h"
#include "storage.h"
#include <errno.h>
#include <stdio.h>

BUILD_ASSERT(CONFIG_PEDOMETER_OLED_HEIGHT == 32 || CONFIG_PEDOMETER_OLED_HEIGHT == 64,
             "OLED height must be 32 or 64");
BUILD_ASSERT(!IS_ENABLED(CONFIG_PEDOMETER_BATTERY_PROFILE_APPROVED) ||
    (CONFIG_PEDOMETER_CHARGE_UA % 1250 == 0 && CONFIG_PEDOMETER_PRECHARGE_UA % 1250 == 0 &&
     CONFIG_PEDOMETER_PRECHARGE_UA <= CONFIG_PEDOMETER_CHARGE_UA &&
     CONFIG_PEDOMETER_CHARGE_UA * CONFIG_PEDOMETER_TERMINATION_PERCENT / 100 >= 500 &&
     CONFIG_PEDOMETER_CAPACITY_MAH * 10000u /
       (CONFIG_PEDOMETER_CHARGE_UA * CONFIG_PEDOMETER_TERMINATION_PERCENT / 100) <= 2000 &&
     CONFIG_PEDOMETER_TS_COLD > CONFIG_PEDOMETER_TS_COOL &&
     CONFIG_PEDOMETER_TS_COOL > CONFIG_PEDOMETER_TS_WARM &&
     CONFIG_PEDOMETER_TS_WARM > CONFIG_PEDOMETER_TS_HOT), "Invalid approved battery profile");
static struct oled display;
static struct motion motion;
static struct step_state steps;
static struct app_clock clock_state;
static struct telemetry status;
static bool pmic_ok, motion_ok, gauge_ready, charging, storage_error, sample_gap;
static uint64_t display_until, pairing_until, passkey_until;
static struct battery_reading battery;
static bool battery_present;
static const struct charge_profile charge_profile = {
    .approved=IS_ENABLED(CONFIG_PEDOMETER_BATTERY_PROFILE_APPROVED),
    .current_ua=CONFIG_PEDOMETER_CHARGE_UA,.precharge_ua=CONFIG_PEDOMETER_PRECHARGE_UA,
    .termination_percent=CONFIG_PEDOMETER_TERMINATION_PERCENT,
    .ts_cold=CONFIG_PEDOMETER_TS_COLD,.ts_cool=CONFIG_PEDOMETER_TS_COOL,
    .ts_warm=CONFIG_PEDOMETER_TS_WARM,.ts_hot=CONFIG_PEDOMETER_TS_HOT
};
static void save(void)
{ storage_error = storage_checkpoint(steps.total, status.stride_mm) != 0; }
static void refresh_status(uint64_t now)
{
    status.steps = steps.total;
    status.distance_mm = steps_distance(steps.total, status.stride_mm);
    status.uptime_s = now/1000u;
    status.millivolts = battery_present ? battery.millivolts : 0;
    status.percent = battery_present && battery.soc_valid ? battery.percent : 255;
    status.flags = (motion_ok ? STATUS_MOTION : 0) | (pmic_ok ? STATUS_PMIC : 0) |
        (battery_present ? STATUS_BATTERY : 0) | (battery.soc_valid && battery_present ? STATUS_SOC : 0) |
        (charging ? STATUS_CHARGE_ENABLED : 0) | (clock_state.valid ? STATUS_TIME : 0) |
        (storage_error ? STATUS_STORAGE_ERROR : 0) | (sample_gap ? STATUS_SAMPLE_GAP : 0);
}
static void show(uint64_t now)
{
    if (!pmic_ok || passkey_until) { return; }
    refresh_status(now);
    if (!oled_status(&display, &status, ble_connected())) {
        display_until = now + CONFIG_PEDOMETER_DISPLAY_SECONDS*1000u;
    }
}
static void power_fault(void)
{
    board_inhibit(true); charging = false; pmic_ok = false;
    oled_off(&display); display_until = 0;
    ble_cancel_pairing(); pairing_until = passkey_until = 0;
}
static void power_update(void)
{
    int rc = board_pmic_wake(true);
    if (rc) { power_fault(); return; }
    if (pmic_ok) { rc = pmic_verify(&board_bus, &charge_profile); }
    if (!pmic_ok || rc) {
        power_fault();
        rc = pmic_setup(&board_bus, &charge_profile);
    }
    if (rc) { power_fault(); board_pmic_wake(false); return; }
    pmic_ok = true;
    board_feed();
    rc = gauge_read(&board_bus, gauge_ready, &battery);
    if (rc == -EAGAIN) {
        gauge_ready = false;
        board_inhibit(true); charging = false;
        rc = gauge_read(&board_bus, false, &battery);
    }
    battery_present = rc == 0;
    if (!battery_present) { gauge_ready = false; battery.soc_valid = false; }
    if (battery_present && charge_profile.approved && !gauge_ready) {
        board_inhibit(true); charging = false;
        uint32_t termination_ua = charge_profile.current_ua * charge_profile.termination_percent / 100u;
        struct gauge_profile gp = {
            .capacity_mah=CONFIG_PEDOMETER_CAPACITY_MAH,.nominal_mv=CONFIG_PEDOMETER_NOMINAL_MV,
            .cutoff_mv=CONFIG_PEDOMETER_CUTOFF_MV,
            .taper_rate=termination_ua ? CONFIG_PEDOMETER_CAPACITY_MAH*10000u/termination_ua : 0
        };
        gauge_ready = gauge_configure(&board_bus, &gp) == 0;
        board_feed();
        if (gauge_ready) {
            rc = gauge_read(&board_bus, true, &battery);
            battery_present = rc == 0;
            if (rc) { gauge_ready = false; }
        }
    }
    bool allow = charge_profile.approved && battery_present && gauge_ready && battery.millivolts <= 4250;
    if (!allow) { board_inhibit(true); charging = false; }
    rc = pmic_allow_charge(&board_bus, allow);
    if (!rc) { rc = board_inhibit(!allow); }
    if (rc) { power_fault(); } else { charging = allow; }
    /* Acknowledge latched interrupt flags; hardware TS/charge limits remain active. */
    uint8_t flags[3];
    if (board_bus.read(board_bus.ctx, PMIC_ADDR, 0x03, flags, sizeof(flags))) { power_fault(); }
    if (board_pmic_wake(false)) { power_fault(); }
}
static void sample_motion(uint64_t now)
{
    bool reset = false;
    if (!motion_ok) {
        if (motion_init(&motion, &board_bus, IS_ENABLED(CONFIG_PEDOMETER_WRIST), &reset)) {
            status.activity = 0; sample_gap = true; return;
        }
        motion_ok = true;
    }
    uint32_t raw; uint8_t activity;
    if (motion_read(&motion, &raw, &activity)) {
        motion_ok = false; status.activity = 0; sample_gap = true; return;
    }
    if (!steps_sample(&steps, raw, now, reset)) { sample_gap = true; }
    status.activity = activity;
}
static void reset_steps(uint64_t now)
{
    sample_motion(now); /* Establish current raw baseline before logical reset. */
    steps.total = 0; sample_gap = false; save(); show(now);
}
static void ship(uint64_t now)
{
    if (!pmic_ok) { return; }
    if (board_usb_present() != 0) {
        oled_text(&display, "UNPLUG USB", "THEN HOLD 8 SECONDS", "TO POWER OFF", "");
        display_until = now+5000; return;
    }
    sample_motion(now); save();
    if (storage_error) { show(now); return; }
    board_inhibit(true); charging = false;
    oled_off(&display); ble_stop(); board_feed();
    if (!board_pmic_wake(true)) { (void)pmic_ship(&board_bus); }
    k_sleep(K_MSEC(250));
    /* If power remained (e.g. USB inserted during the request), cancel the
     * deferred ship bit so a later unplug does not unexpectedly turn off. */
    uint8_t ctrl;
    if (!reg_read8(&board_bus, PMIC_ADDR, 0x35, &ctrl)) {
        (void)reg_write8(&board_bus, PMIC_ADDR, 0x35, ctrl & 0x34u);
    }
    board_reboot();
}
static void handle(struct command cmd, uint64_t now)
{
    switch (cmd.action) {
    case ACTION_SHOW: show(now); break;
    case ACTION_PAIR:
        if (pmic_ok && !oled_text(&display, "PAIRING OPEN 60S", "CONNECT FROM PHONE", "ENTER OLED PASSKEY", "")) {
            pairing_until = now+60000; display_until = pairing_until;
            ble_pair_window(pairing_until);
        }
        break;
    case ACTION_RESET: reset_steps(now); break;
    case ACTION_SHIP: ship(now); break;
    case ACTION_STRIDE: status.stride_mm = cmd.value; save(); show(now); break;
    case ACTION_TIME: (void)clock_sync(&clock_state, cmd.value, cmd.timezone, now); break;
    case ACTION_PASSKEY: {
        if (!pmic_ok || now >= pairing_until) { ble_cancel_pairing(); break; }
        char code[22]; snprintf(code, sizeof(code), "%06lu", (unsigned long)cmd.value);
        if (oled_text(&display, "ENTER ON PHONE", code, "PAIRING PASSKEY", "")) { ble_cancel_pairing(); break; }
        passkey_until = pairing_until; display_until = pairing_until;
        break;
    }
    case ACTION_PAIR_DONE:
        ble_pair_window(0); pairing_until = passkey_until = 0; show(now); break;
    default: break;
    }
}
int main(void)
{
    int rc = board_init();
    if (rc) { board_reboot(); }
    rc = oled_init(&display, &board_oled, CONFIG_PEDOMETER_OLED_HEIGHT);
    if (rc) { board_reboot(); }
    status.stride_mm = CONFIG_PEDOMETER_STRIDE_MM;
    /* Keep /CE high throughout boot, even if the gauge is absent. */
    board_inhibit(true);
    if (!board_pmic_wake(true)) { pmic_ok = pmic_setup(&board_bus, &charge_profile) == 0; }
    board_pmic_wake(false); board_feed();
    rc = ble_start();
    if (rc) {
        if (pmic_ok) { oled_text(&display, "BLUETOOTH INIT ERROR", "RESTARTING", "", ""); }
        k_sleep(K_MSEC(1000)); board_reboot();
    }
    storage_restore(&steps.total, &status.stride_mm);
    power_update();
    uint64_t now = k_uptime_get();
    sample_motion(now); show(now); board_feed();
    uint64_t next_sample=now+5000, next_power=now+10000, next_save=now+300000;
    uint64_t next_display=now+1000, pressed_at=0, changed_at=now;
    int stable=1, observed=board_button();
    for (;;) {
        now = k_uptime_get(); board_feed();
        int level = board_button();
        if (level >= 0 && level != observed) { observed=level; changed_at=now; }
        if (level >= 0 && observed != stable && now-changed_at >= 30) {
            stable = observed;
            if (!stable) { pressed_at=now; }
            else { handle((struct command){.action=button_action(now-pressed_at)}, now); }
        }
        struct command cmd;
        /* Bound work per iteration so a connected client cannot starve sampling. */
        for (unsigned n=0; n<8 && ble_command_get(&cmd); ++n) { handle(cmd, now); }
        if (now >= next_power) { power_update(); now=k_uptime_get(); next_power=now+10000; }
        if (now >= next_sample) {
            sample_motion(now);
            if (clock_new_day(&clock_state, now)) { steps.total=0; sample_gap=false; save(); }
            next_sample=now+5000;
        }
        if (now >= next_save) { save(); next_save=now+(storage_error ? 10000 : 300000); }
        if (pairing_until && now >= pairing_until) {
            ble_cancel_pairing(); pairing_until=passkey_until=0; show(now);
        }
        if (display.active && now >= display_until) { oled_off(&display); }
        if (display.active && !pairing_until && now >= next_display) {
            refresh_status(now); oled_status(&display, &status, ble_connected()); next_display=now+1000;
        }
        refresh_status(now); ble_poll(now); ble_publish(&status);
        /* GPIO interrupt wakes idle instantly; 20 ms while debouncing/held.
         * One-second idle cadence also keeps the watchdog serviced. */
        k_sem_take(&app_wake, K_MSEC(!stable || stable != observed ? 20 : 1000));
    }
}
