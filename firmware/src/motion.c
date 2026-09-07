#include "motion.h"
#include <errno.h>
#include <string.h>
static BMA400_INTF_RET_TYPE read_reg(uint8_t r, uint8_t *d, uint32_t n, void *ctx)
{
    struct motion *m = ctx;
    return m->bus->read(m->bus->ctx, 0x14, r, d, n) ? -1 : 0;
}
static BMA400_INTF_RET_TYPE write_reg(uint8_t r, const uint8_t *d, uint32_t n, void *ctx)
{
    struct motion *m = ctx;
    return m->bus->write(m->bus->ctx, 0x14, r, d, n) ? -1 : 0;
}
static void delay_us(uint32_t us, void *ctx)
{
    struct motion *m = ctx;
    m->bus->delay_ms(m->bus->ctx, (us + 999u) / 1000u);
}
/* Bosch SensorAPI bma400.h, table for registers 0x59..0x70. */
static const uint8_t wrist_params[24] = {
    1,45,123,212,68,1,59,122,219,123,63,108,205,39,25,150,160,195,14,12,60,240,0,247
};
static const uint8_t nonwrist_params[24] = {
    1,50,120,230,135,0,132,108,156,117,100,126,170,12,12,74,160,0,0,12,60,240,1,0
};
int motion_init(struct motion *m, const struct reg_bus *b, bool wrist, bool *reset)
{
    memset(m, 0, sizeof(*m)); m->bus = b;
    m->dev.intf = BMA400_I2C_INTF; m->dev.read = read_reg;
    m->dev.write = write_reg; m->dev.delay_us = delay_us; m->dev.intf_ptr = m;
    if (bma400_init(&m->dev) != BMA400_OK) { return -ENODEV; }
    uint8_t mode, params[24];
    struct bma400_int_enable en = {.type = BMA400_STEP_COUNTER_INT_EN};
    if (bma400_get_power_mode(&mode, &m->dev) != BMA400_OK ||
        bma400_get_interrupts_enabled(&en, 1, &m->dev) != BMA400_OK ||
        b->read(b->ctx, 0x14, 0x59, params, sizeof(params))) { return -EIO; }
    const uint8_t *wanted = wrist ? wrist_params : nonwrist_params;
    *reset = mode != BMA400_MODE_NORMAL || !en.conf || memcmp(params, wanted, 24);
    if (!*reset) { return 0; }
    if (bma400_soft_reset(&m->dev) != BMA400_OK) { return -EIO; }
    b->delay_ms(b->ctx, 5);
    struct bma400_sensor_conf conf = {.type = BMA400_ACCEL};
    if (bma400_get_sensor_conf(&conf, 1, &m->dev) != BMA400_OK) { return -EIO; }
    conf.param.accel.odr = BMA400_ODR_100HZ;
    conf.param.accel.range = BMA400_RANGE_4G;
    conf.param.accel.osr = BMA400_ACCEL_OSR_SETTING_0;
    conf.param.accel.data_src = BMA400_DATA_SRC_ACCEL_FILT_2;
    if (bma400_set_sensor_conf(&conf, 1, &m->dev) != BMA400_OK ||
        bma400_set_step_counter_param(wanted, &m->dev) != BMA400_OK) { return -EIO; }
    struct bma400_device_conf pins[2] = {
        {.type = BMA400_INT_PIN_CONF, .param.int_conf = {
            .int_chan = BMA400_INT_CHANNEL_1, .pin_conf = BMA400_INT_PUSH_PULL_ACTIVE_1}},
        {.type = BMA400_INT_PIN_CONF, .param.int_conf = {
            .int_chan = BMA400_INT_CHANNEL_2, .pin_conf = BMA400_INT_PUSH_PULL_ACTIVE_1}}
    };
    if (bma400_set_device_conf(pins, 2, &m->dev) != BMA400_OK ||
        bma400_set_power_mode(BMA400_MODE_NORMAL, &m->dev) != BMA400_OK) { return -EIO; }
    b->delay_ms(b->ctx, 20);
    en.conf = BMA400_ENABLE;
    if (bma400_enable_interrupt(&en, 1, &m->dev) != BMA400_OK) { return -EIO; }
    return 0;
}
int motion_read(struct motion *m, uint32_t *steps, uint8_t *activity)
{
    uint8_t mode;
    struct bma400_int_enable en = {.type = BMA400_STEP_COUNTER_INT_EN};
    if (bma400_get_power_mode(&mode, &m->dev) != BMA400_OK ||
        bma400_get_interrupts_enabled(&en, 1, &m->dev) != BMA400_OK ||
        mode != BMA400_MODE_NORMAL || !en.conf) { return -EIO; }
    return bma400_get_steps_counted(steps, activity, &m->dev) == BMA400_OK ? 0 : -EIO;
}
