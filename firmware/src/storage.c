#include "storage.h"
#include <zephyr/settings/settings.h>
#include <zephyr/sys/byteorder.h>
#include <errno.h>
#include <string.h>
static uint32_t saved_steps;
static uint16_t saved_stride = CONFIG_PEDOMETER_STRIDE_MM;
static bool have_saved;
static int load(const char *key, size_t len, settings_read_cb read, void *arg)
{
    if (strcmp(key, "state")) { return -ENOENT; }
    uint8_t data[12];
    if (len != sizeof(data)) { return -EINVAL; }
    int rc = read(arg, data, sizeof(data));
    if (rc != sizeof(data)) { return rc < 0 ? rc : -EIO; }
    uint16_t stride = sys_get_le16(data+8);
    if (sys_get_le32(data) != 1 || stride < 100 || stride > 2000 || sys_get_le16(data+10)) { return -EINVAL; }
    saved_steps = sys_get_le32(data+4); saved_stride = stride; have_saved = true;
    return 0;
}
SETTINGS_STATIC_HANDLER_DEFINE(pedometer, "pedometer", NULL, load, NULL, NULL);
void storage_restore(uint32_t *steps, uint16_t *stride)
{ *steps = saved_steps; *stride = saved_stride; }
int storage_checkpoint(uint32_t steps, uint16_t stride)
{
    if (stride < 100 || stride > 2000) { return -EINVAL; }
    if (have_saved && steps == saved_steps && stride == saved_stride) { return 0; }
    uint8_t data[12] = {0};
    sys_put_le32(1, data); sys_put_le32(steps, data+4); sys_put_le16(stride, data+8);
    int rc = settings_save_one("pedometer/state", data, sizeof(data));
    if (!rc) { saved_steps = steps; saved_stride = stride; have_saved = true; }
    return rc;
}
