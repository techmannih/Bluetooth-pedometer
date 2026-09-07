#include "ble.h"
#include "platform.h"
#include <zephyr/bluetooth/bluetooth.h>
#include <zephyr/bluetooth/conn.h>
#include <zephyr/bluetooth/gatt.h>
#include <zephyr/bluetooth/hci.h>
#include <zephyr/settings/settings.h>
#include <zephyr/sys/atomic.h>
#include <errno.h>
#include <string.h>
#define UUID(n) BT_UUID_128_ENCODE(0xc2a10000u+(n),0x6a9b,0x4e31,0x9d42,0x7b680ca4c901)
static struct bt_uuid_128 service_uuid = BT_UUID_INIT_128(UUID(1));
static struct bt_uuid_128 telemetry_uuid = BT_UUID_INIT_128(UUID(2));
static struct bt_uuid_128 control_uuid = BT_UUID_INIT_128(UUID(3));
static struct k_spinlock lock;
static struct bt_conn *peer;
static uint64_t pairing_until;
static uint64_t connected_since;
static uint8_t snapshot[20] = {[14]=255, [19]=1};
static atomic_t restart_adv;
static bool enabled;
K_MSGQ_DEFINE(commands, sizeof(struct command), 8, 4);
static int enqueue(struct command cmd)
{
    int rc = k_msgq_put(&commands, &cmd, K_NO_WAIT);
    if (!rc) { k_sem_give(&app_wake); }
    return rc;
}
bool ble_command_get(struct command *cmd) { return k_msgq_get(&commands, cmd, K_NO_WAIT) == 0; }
static struct bt_conn *get_peer(void)
{
    k_spinlock_key_t key = k_spin_lock(&lock);
    struct bt_conn *conn = peer ? bt_conn_ref(peer) : NULL;
    k_spin_unlock(&lock, key); return conn;
}
bool ble_connected(void)
{ struct bt_conn *conn = get_peer(); if (!conn) { return false; } bt_conn_unref(conn); return true; }
void ble_pair_window(uint64_t until)
{
    k_spinlock_key_t key = k_spin_lock(&lock);
    pairing_until = until; k_spin_unlock(&lock, key);
}
static bool pairing_open(void)
{
    k_spinlock_key_t key = k_spin_lock(&lock);
    bool open = (uint64_t)k_uptime_get() < pairing_until;
    k_spin_unlock(&lock, key); return open;
}
static ssize_t read_telemetry(struct bt_conn *conn, const struct bt_gatt_attr *attr,
                             void *buf, uint16_t len, uint16_t offset)
{
    uint8_t data[20]; k_spinlock_key_t key = k_spin_lock(&lock);
    memcpy(data, snapshot, sizeof(data)); k_spin_unlock(&lock, key);
    return bt_gatt_attr_read(conn, attr, buf, len, offset, data, sizeof(data));
}
static ssize_t write_control(struct bt_conn *conn, const struct bt_gatt_attr *attr,
                            const void *buf, uint16_t len, uint16_t offset, uint8_t flags)
{
    ARG_UNUSED(conn); ARG_UNUSED(attr);
    if (offset) { return BT_GATT_ERR(BT_ATT_ERR_INVALID_OFFSET); }
    if (flags & BT_GATT_WRITE_FLAG_PREPARE) { return BT_GATT_ERR(BT_ATT_ERR_NOT_SUPPORTED); }
    struct command cmd;
    int rc = command_decode(buf, len, &cmd);
    if (rc) { return BT_GATT_ERR(BT_ATT_ERR_VALUE_NOT_ALLOWED); }
    if (enqueue(cmd)) { return BT_GATT_ERR(BT_ATT_ERR_INSUFFICIENT_RESOURCES); }
    return len;
}
static void ccc_changed(const struct bt_gatt_attr *attr, uint16_t value)
{ ARG_UNUSED(attr); ARG_UNUSED(value); k_sem_give(&app_wake); }
BT_GATT_SERVICE_DEFINE(pedometer_service,
    BT_GATT_PRIMARY_SERVICE(&service_uuid),
    BT_GATT_CHARACTERISTIC(&telemetry_uuid.uuid, BT_GATT_CHRC_READ|BT_GATT_CHRC_NOTIFY,
        BT_GATT_PERM_READ_AUTHEN, read_telemetry, NULL, NULL),
    BT_GATT_CCC(ccc_changed, BT_GATT_PERM_READ_AUTHEN|BT_GATT_PERM_WRITE_AUTHEN),
    BT_GATT_CHARACTERISTIC(&control_uuid.uuid, BT_GATT_CHRC_WRITE,
        BT_GATT_PERM_WRITE_AUTHEN, NULL, write_control, NULL)
);
static const struct bt_data adv[] = {
    BT_DATA_BYTES(BT_DATA_FLAGS, BT_LE_AD_GENERAL|BT_LE_AD_NO_BREDR),
    BT_DATA_BYTES(BT_DATA_UUID128_ALL, UUID(1))
};
static const struct bt_data scan[] = {
    BT_DATA(BT_DATA_NAME_COMPLETE, CONFIG_BT_DEVICE_NAME, sizeof(CONFIG_BT_DEVICE_NAME)-1)
};
static int advertise(void)
{
    int rc = bt_le_adv_start(BT_LE_ADV_PARAM(BT_LE_ADV_OPT_CONNECTABLE, 1600, 1920, NULL),
        adv, ARRAY_SIZE(adv), scan, ARRAY_SIZE(scan));
    return rc == -EALREADY ? 0 : rc;
}
static void connected(struct bt_conn *conn, uint8_t err)
{
    if (err) { atomic_set(&restart_adv, 1); k_sem_give(&app_wake); return; }
    k_spinlock_key_t key = k_spin_lock(&lock);
    peer = bt_conn_ref(conn); connected_since = k_uptime_get(); k_spin_unlock(&lock, key);
    k_sem_give(&app_wake);
    /* Client requests security when accessing authenticated attributes.
     * Existing bonds can reconnect without opening a new pairing window. */
}
static void disconnected(struct bt_conn *conn, uint8_t reason)
{
    ARG_UNUSED(reason);
    k_spinlock_key_t key = k_spin_lock(&lock);
    struct bt_conn *old = peer == conn ? peer : NULL;
    if (old) { peer = NULL; }
    k_spin_unlock(&lock, key);
    if (old) { bt_conn_unref(old); }
    atomic_set(&restart_adv, 1); k_sem_give(&app_wake);
}
BT_CONN_CB_DEFINE(connection_callbacks) = {.connected=connected,.disconnected=disconnected};
static enum bt_security_err accept_pairing(struct bt_conn *conn, const struct bt_conn_pairing_feat *feat)
{
    ARG_UNUSED(conn); ARG_UNUSED(feat);
    return pairing_open() ? BT_SECURITY_ERR_SUCCESS : BT_SECURITY_ERR_PAIR_NOT_ALLOWED;
}
static void passkey_display(struct bt_conn *conn, unsigned int code)
{
    if (!pairing_open() || enqueue((struct command){.action=ACTION_PASSKEY,.value=code})) {
        bt_conn_auth_cancel(conn);
    }
}
static void auth_cancel(struct bt_conn *conn)
{ ARG_UNUSED(conn); enqueue((struct command){.action=ACTION_PAIR_DONE}); }
static struct bt_conn_auth_cb auth = {
    .pairing_accept=accept_pairing,.passkey_display=passkey_display,.cancel=auth_cancel
};
static void paired(struct bt_conn *conn, bool bonded)
{
    ARG_UNUSED(conn); ARG_UNUSED(bonded);
    ble_pair_window(0); enqueue((struct command){.action=ACTION_PAIR_DONE});
}
static void pairing_failed(struct bt_conn *conn, enum bt_security_err reason)
{ ARG_UNUSED(conn); ARG_UNUSED(reason); auth_cancel(conn); }
static struct bt_conn_auth_info_cb auth_info = {.pairing_complete=paired,.pairing_failed=pairing_failed};
void ble_cancel_pairing(void)
{
    ble_pair_window(0);
    struct bt_conn *conn = get_peer();
    if (conn) { if (bt_conn_get_security(conn) < BT_SECURITY_L3) { bt_conn_auth_cancel(conn); } bt_conn_unref(conn); }
}
int ble_start(void)
{
    int rc = settings_subsys_init(); if (rc) { return rc; }
    rc = bt_conn_auth_cb_register(&auth); if (rc) { return rc; }
    rc = bt_conn_auth_info_cb_register(&auth_info); if (rc) { return rc; }
    rc = bt_enable(NULL); if (rc) { return rc; }
    /* Required after bt_enable: load both bonds/identity and pedometer state. */
    rc = settings_load(); if (rc) { return rc; }
    enabled = true;
    rc = advertise();
    if (rc) { atomic_set(&restart_adv, 1); }
    return 0;
}
void ble_poll(uint64_t now)
{
    struct bt_conn *conn = get_peer();
    if (conn) {
        k_spinlock_key_t key = k_spin_lock(&lock);
        uint64_t since = connected_since;
        k_spin_unlock(&lock, key);
        if (now >= since + 30000 && !pairing_open() && bt_conn_get_security(conn) < BT_SECURITY_L3) {
            bt_conn_disconnect(conn, BT_HCI_ERR_AUTH_FAIL);
        }
        bt_conn_unref(conn);
    }
    if (enabled && atomic_cas(&restart_adv, 1, 0) && !ble_connected()) {
        if (advertise()) { atomic_set(&restart_adv, 1); }
    }
}
void ble_publish(const struct telemetry *t)
{
    uint8_t data[20]; telemetry_encode(t, data);
    k_spinlock_key_t key = k_spin_lock(&lock);
    bool changed = memcmp(snapshot, data, 20) != 0;
    memcpy(snapshot, data, 20); k_spin_unlock(&lock, key);
    if (!enabled || !changed) { return; }
    struct bt_conn *conn = get_peer(); if (!conn) { return; }
    if (bt_conn_get_security(conn) >= BT_SECURITY_L3 &&
        bt_gatt_is_subscribed(conn, &pedometer_service.attrs[2], BT_GATT_CCC_NOTIFY)) {
        (void)bt_gatt_notify(conn, &pedometer_service.attrs[2], data, sizeof(data));
    }
    bt_conn_unref(conn);
}
void ble_stop(void)
{
    enabled = false; ble_cancel_pairing();
    (void)bt_le_adv_stop();
    struct bt_conn *conn = get_peer();
    if (conn) { bt_conn_disconnect(conn, BT_HCI_ERR_REMOTE_USER_TERM_CONN); bt_conn_unref(conn); }
}
