#include "platform.h"
#include <zephyr/drivers/gpio.h>
#include <zephyr/drivers/i2c.h>
#include <zephyr/drivers/spi.h>
#include <zephyr/pm/device.h>
#include <zephyr/drivers/watchdog.h>
#include <zephyr/sys/reboot.h>
#include <errno.h>
#include <string.h>
BUILD_ASSERT(!IS_ENABLED(CONFIG_SPI_SLAVE), "This board uses SPI master only");
static const struct device *const gpio = DEVICE_DT_GET(DT_NODELABEL(gpio0));
static const struct device *const i2c = DEVICE_DT_GET(DT_NODELABEL(i2c0));
static const struct device *const spi = DEVICE_DT_GET(DT_NODELABEL(spi0));
static const struct device *const wdt = DEVICE_DT_GET(DT_ALIAS(watchdog0));
K_SEM_DEFINE(app_wake, 0, 1);
K_SEM_DEFINE(i2c_done, 0, 1);
static int transfer_status;
static int watchdog_channel = -1;
static struct gpio_callback button_cb;
int board_inhibit(bool inhibit) { return gpio_pin_set(gpio, 1, inhibit); }
int board_pmic_wake(bool awake)
{
    int rc = gpio_pin_set(gpio, 14, awake);
    if (awake && !rc) { k_sleep(K_MSEC(2)); }
    return rc;
}
int board_button(void) { return gpio_pin_get(gpio, 15); }
int board_usb_present(void)
{ int v = gpio_pin_get(gpio, 22); return v < 0 ? v : !v; }
void board_feed(void) { if (watchdog_channel >= 0) { wdt_feed(wdt, watchdog_channel); } }
void board_reboot(void)
{
    board_inhibit(true);
    gpio_pin_set(gpio, 21, 0);
    sys_reboot(SYS_REBOOT_COLD);
    for (;;) {} /* Watchdog fallback; never return to a timed-out transfer. */
}
static void transfer_done(const struct device *dev, int result, void *unused)
{ ARG_UNUSED(dev); ARG_UNUSED(unused); transfer_status = result; k_sem_give(&i2c_done); }
static int transaction(struct i2c_msg *msgs, uint8_t count, uint8_t addr)
{
    k_sem_reset(&i2c_done);
    int rc = i2c_transfer_cb(i2c, msgs, count, addr, transfer_done, NULL);
    if (rc) { return rc; }
    /* All I2C calls originate on main. TI's async driver has no cancel API.
     * Reboot before stack buffers can expire if the transaction never finishes. */
    if (k_sem_take(&i2c_done, K_MSEC(1000))) { board_reboot(); }
    return transfer_status;
}
static int read_regs(void *ctx, uint8_t a, uint8_t r, uint8_t *d, size_t n)
{
    ARG_UNUSED(ctx);
    if (!n || n > 64) { return -EINVAL; }
    struct i2c_msg msgs[2] = {
        {.buf=&r,.len=1,.flags=I2C_MSG_WRITE},
        {.buf=d,.len=n,.flags=I2C_MSG_RESTART|I2C_MSG_READ|I2C_MSG_STOP}
    };
    return transaction(msgs, 2, a);
}
static int write_regs(void *ctx, uint8_t a, uint8_t r, const uint8_t *d, size_t n)
{
    ARG_UNUSED(ctx);
    if (!n || n > 64) { return -EINVAL; }
    uint8_t buf[65]; buf[0] = r; memcpy(buf+1, d, n);
    struct i2c_msg msg = {.buf=buf,.len=n+1,.flags=I2C_MSG_WRITE|I2C_MSG_STOP};
    return transaction(&msg, 1, a);
}
static void delay_ms(void *ctx, uint32_t ms) { ARG_UNUSED(ctx); k_sleep(K_MSEC(ms)); }
const struct reg_bus board_bus = {.read=read_regs,.write=write_regs,.delay_ms=delay_ms};
void board_bus_recover(void) { (void)i2c_recover_bus(i2c); }
static int oled_pin_set(enum oled_pin p, bool high)
{
    static const uint8_t pins[] = {21,13,12,11};
    return gpio_pin_set(gpio, pins[p], high);
}
static int oled_spi_write(const uint8_t *data, size_t size)
{
    int rc = pm_device_action_run(spi, PM_DEVICE_ACTION_RESUME);
    if (rc && rc != -EALREADY) { return rc; }
    static const struct spi_config config = {.frequency=1000000,
        .operation=SPI_OP_MODE_MASTER|SPI_WORD_SET(8)|SPI_TRANSFER_MSB};
    const struct spi_buf b = {.buf=(void *)data,.len=size};
    const struct spi_buf_set set = {.buffers=&b,.count=1};
    return spi_write(spi, &config, &set);
}
static int oled_sleep_pins(void)
{
    /* Keep the SPI device suspended across system sleep/resume while OLED is
     * off; otherwise a system wake could restore driven pins into an off rail. */
    int rc = pm_device_action_run(spi, PM_DEVICE_ACTION_SUSPEND);
    return rc == -EALREADY ? 0 : rc;
}
static void oled_delay(uint32_t ms) { k_sleep(K_MSEC(ms)); }
const struct oled_io board_oled = {
    .pin=oled_pin_set,.write=oled_spi_write,.sleep_pins=oled_sleep_pins,.delay_ms=oled_delay
};
static void button_irq(const struct device *dev, struct gpio_callback *cb, uint32_t pins)
{ ARG_UNUSED(dev); ARG_UNUSED(cb); ARG_UNUSED(pins); k_sem_give(&app_wake); }
int board_init(void)
{
    if (!device_is_ready(gpio)) { return -ENODEV; }
    int rc = gpio_pin_configure(gpio, 1, GPIO_OUTPUT_HIGH);
    const uint8_t low[] = {21,13,12,11,14};
    for (size_t i = 0; i < sizeof(low); ++i) {
        if (!rc) { rc = gpio_pin_configure(gpio, low[i], GPIO_OUTPUT_LOW); }
    }
    if (rc) { return rc; }
    if (!device_is_ready(wdt) || !device_is_ready(i2c) || !device_is_ready(spi)) { return -ENODEV; }
    struct wdt_timeout_cfg cfg = {.window={.min=0,.max=8000},.flags=WDT_FLAG_RESET_SOC};
    watchdog_channel = wdt_install_timeout(wdt, &cfg);
    if (watchdog_channel < 0) { return watchdog_channel; }
    rc = wdt_setup(wdt, WDT_OPT_PAUSE_HALTED_BY_DBG);
    if (rc) { return rc; }
    rc = i2c_configure(i2c, I2C_MODE_CONTROLLER|I2C_SPEED_SET(I2C_SPEED_STANDARD));
    if (rc) { return rc; }
    const uint8_t inputs[] = {9,10,15,18,20,22};
    for (size_t i = 0; i < sizeof(inputs); ++i) {
        rc = gpio_pin_configure(gpio, inputs[i], GPIO_INPUT);
        if (rc) { return rc; }
    }
    gpio_init_callback(&button_cb, button_irq, BIT(15));
    rc = gpio_add_callback(gpio, &button_cb);
    if (!rc) { rc = gpio_pin_interrupt_configure(gpio, 15, GPIO_INT_EDGE_BOTH); }
    if (!rc) { rc = oled_sleep_pins(); }
    return rc;
}
