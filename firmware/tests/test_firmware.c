#include "core.h"
#include "pmic.h"
#include "gauge.h"
#include "motion.h"
#include "oled.h"
#include <assert.h>
#include <errno.h>
#include <limits.h>
#include <stdio.h>
#include <string.h>

static void test_steps(void)
{
    struct step_state s = {0};
    assert(steps_sample(&s, 0xfffffa, 0, false));
    assert(steps_sample(&s, 3, 2000, false) && s.total == 9);
    assert(steps_sample(&s, 7, 3000, false) && s.total == 13);
    assert(!steps_sample(&s, 8, 2000, false) && s.raw == 7);
    assert(!steps_sample(&s, 0, 4000, false) && s.total == 13);
    assert(steps_sample(&s, 5, 5000, false) && s.total == 18);
    assert(steps_sample(&s, 0, 6000, true) && s.total == 18);
    s.total = UINT32_MAX - 2;
    assert(steps_sample(&s, 8, 7000, false) && s.total == UINT32_MAX);
    assert(steps_distance(1000,750) == 750000);
    assert(steps_distance(UINT32_MAX,2000) == UINT32_MAX);
    assert(button_action(39)==ACTION_NONE && button_action(40)==ACTION_SHOW);
    assert(button_action(1999)==ACTION_SHOW && button_action(2000)==ACTION_PAIR);
    assert(button_action(4999)==ACTION_PAIR && button_action(5000)==ACTION_RESET);
    assert(button_action(7999)==ACTION_RESET && button_action(8000)==ACTION_SHIP);
}
static void test_clock_and_protocol(void)
{
    struct app_clock c = {0};
    assert(!clock_new_day(&c, 100000));
    assert(!clock_sync(&c, 0, 330, 0));
    assert(!clock_sync(&c, 1700000000, 841, 0));
    /* UTC 2024-01-01 18:29:59 is 23:59:59 at UTC+05:30. */
    assert(clock_sync(&c, 1704133799, 330, 1000));
    assert(!clock_new_day(&c, 1999));
    assert(clock_new_day(&c, 2000));
    assert(!clock_new_day(&c, 2001));
    assert(!clock_new_day(&c, 0));
    assert(clock_sync(&c,1704067199,0,0));
    assert(clock_new_day(&c,1000));
    assert(clock_sync(&c,1704085199,-300,0));
    assert(clock_new_day(&c,1000));
    struct telemetry t = {.steps=0x12345678,.distance_mm=750000,.uptime_s=42,
        .millivolts=3800,.stride_mm=750,.percent=255,.flags=5,.activity=2};
    uint8_t wire[20]; telemetry_encode(&t,wire);
    const uint8_t expected[20] = {0x78,0x56,0x34,0x12,0xb0,0x71,0x0b,0,42,0,0,0,0xd8,0x0e,255,5,0xee,2,2,1};
    assert(!memcmp(wire,expected,20));
    struct command cmd;
    const uint8_t stride[] = {4,0xee,2};
    assert(!command_decode(stride,3,&cmd) && cmd.action==ACTION_STRIDE && cmd.value==750);
    for (unsigned op=0;op<256;++op) {
        uint8_t data[32] = {0}; data[0]=op;
        for (size_t n=0;n<sizeof(data);++n) {
            int rc=command_decode(data,n,&cmd);
            assert((rc==0) == (op>=1 && op<=3 && n==1));
        }
    }
    const uint8_t time[] = {5,0x80,0x00,0x92,0x65,0xd4,0xfe};
    assert(!command_decode(time,7,&cmd) && cmd.timezone==-300 && cmd.action==ACTION_TIME);
}
struct mock {
    uint8_t pmic[256], sensor[256], gauge[256];
    int nack_addr, corrupt_reg, corrupt_addr;
    bool sealed;
    uint16_t chem;
    unsigned gauge_cfg_count;
};
static int read_bus(void *ctx,uint8_t a,uint8_t r,uint8_t *d,size_t n)
{
    struct mock *m=ctx;
    if (a==m->nack_addr) { return -ENXIO; }
    assert((size_t)r+n<=256);
    uint8_t *src=a==0x6b?m->pmic:a==0x14?m->sensor:m->gauge;
    memcpy(d,src+r,n);
    if (a==m->corrupt_addr && r==m->corrupt_reg) { d[0]^=1; }
    return 0;
}
static void word(uint8_t *d,uint16_t v) { d[0]=v;d[1]=v>>8; }
static int write_bus(void *ctx,uint8_t a,uint8_t r,const uint8_t *d,size_t n)
{
    struct mock *m=ctx;
    if (a==m->nack_addr) { return -ENXIO; }
    assert((size_t)r+n<=256);
    uint8_t *dst=a==0x6b?m->pmic:a==0x14?m->sensor:m->gauge;
    memcpy(dst+r,d,n);
    if (a==0x14 && r==0x19) { m->sensor[3]=(m->sensor[3]&~6u)|((d[0]&3u)<<1); }
    if (a==0x14 && r==0x7e && d[0]==0xb6) {
        memset(m->sensor,0,256); m->sensor[0]=0x90;
    }
    if (a==0x55 && r==0 && n==2) {
        switch (d[0] | (uint16_t)d[1]<<8) {
        case 1: word(m->gauge,0x0427);break;
        case 8: word(m->gauge,m->chem);break;
        case 0x8000:m->sealed=false;break;
        case 0x13:m->gauge[6]|=0x10;m->gauge_cfg_count++;break;
        case 0x31:m->chem=1202;break;
        case 0x42:m->gauge[6]&=~0x30;break;
        case 0x20:m->sealed=true;break;
        default:break;
        }
    }
    return 0;
}
static void delay_bus(void *ctx,uint32_t ms) { (void)ctx;(void)ms; }
static struct reg_bus make_bus(struct mock *m)
{ return (struct reg_bus){.read=read_bus,.write=write_bus,.delay_ms=delay_bus,.ctx=m}; }
static struct charge_profile profile(void)
{
    return (struct charge_profile){.approved=true,.current_ua=10000,.precharge_ua=2500,
        .termination_percent=10,.ts_cold=0x7c,.ts_cool=0x6d,.ts_warm=0x38,.ts_hot=0x27};
}
static void test_pmic_faults(void)
{
    struct mock m={.nack_addr=-1,.corrupt_addr=-1};struct reg_bus b=make_bus(&m);
    m.pmic[0x6f]=0x20;
    struct charge_profile p=profile();p.approved=false;
    m.pmic[0x13]=0x77;
    assert(!pmic_setup(&b,&p));
    assert(m.pmic[0x1d]==0xe0 && (m.pmic[0x37]&1) && m.pmic[0x13]==0x77);
    p.approved=true;
    assert(!pmic_setup(&b,&p));
    assert(m.pmic[0x12]==60 && m.pmic[0x13]==8 && m.pmic[0x14]==2);
    assert(m.pmic[0x15]==20 && m.pmic[0x19]==1 && m.pmic[0x17]==0xc2);
    assert(m.pmic[0x37]&1); /* setup never enables charging */
    assert(!pmic_allow_charge(&b,true) && !(m.pmic[0x37]&1));
    m.pmic[0x1d]=0xb0; assert(pmic_verify(&b,&p)==-EIO);
    m.corrupt_addr=0x6b;m.corrupt_reg=0x13;
    assert(pmic_setup(&b,&p)==-EIO && (m.pmic[0x37]&1));
    m.corrupt_addr=-1;p.current_ua=10001;assert(pmic_setup(&b,&p)==-EINVAL);
    p=profile();p.termination_percent=1;assert(pmic_setup(&b,&p)==-EINVAL);
    p=profile();p.ts_hot=p.ts_cold;assert(pmic_setup(&b,&p)==-EINVAL);
    p=profile();m.nack_addr=0x6b;assert(pmic_setup(&b,&p)==-ENXIO);
    m.nack_addr=-1;m.pmic[0x35]=0xff;
    assert(!pmic_ship(&b) && m.pmic[0x35]==0xb4); /* no replayed reset bits */
}
static void test_gauge_faults(void)
{
    struct mock m={.nack_addr=0x55,.corrupt_addr=-1};struct reg_bus b=make_bus(&m);
    struct battery_reading out;
    assert(gauge_read(&b,false,&out)==-ENXIO && !out.soc_valid);
    m.nack_addr=-1;word(m.gauge+4,3800);m.gauge[6]=0x28;
    assert(!gauge_read(&b,false,&out) && out.millivolts==3800 && out.percent==255);
    assert(gauge_read(&b,true,&out)==-EAGAIN);
    m.gauge[6]=8;word(m.gauge+0x1c,75);
    assert(!gauge_read(&b,true,&out) && out.soc_valid && out.percent==75);
    word(m.gauge+0x1c,101);assert(gauge_read(&b,true,&out)==-ERANGE);
    struct gauge_profile p={.capacity_mah=100,.nominal_mv=3700,.cutoff_mv=3200,.taper_rate=1000};
    m.gauge[0x60]=255;
    assert(!gauge_configure(&b,&p) && m.sealed && m.chem==1202);
    assert(m.gauge[0x46]==0 && m.gauge[0x47]==100);
    assert(m.gauge[0x48]==1 && m.gauge[0x49]==0x72); /* 370 mWh */
    m.corrupt_addr=0x55;m.corrupt_reg=0x60;
    assert(gauge_configure(&b,&p)==-EIO && m.sealed && !(m.gauge[6]&0x10));
    p.capacity_mah=50;assert(gauge_configure(&b,&p)==-EINVAL);
}
static void test_motion_reset(void)
{
    struct mock m={.nack_addr=-1,.corrupt_addr=-1};struct reg_bus b=make_bus(&m);
    m.sensor[0]=0x90;struct motion motion;bool reset;
    assert(!motion_init(&motion,&b,false,&reset) && reset);
    assert(m.sensor[0x5a]==50 && m.sensor[0x5d]==135);
    m.sensor[0x15]=0x56;m.sensor[0x16]=0x34;m.sensor[0x17]=0x12;
    uint32_t count;uint8_t activity;
    assert(!motion_read(&motion,&count,&activity) && count==0x123456);
    assert(!motion_init(&motion,&b,false,&reset) && !reset);
    assert(!motion_init(&motion,&b,true,&reset) && reset && m.sensor[0x5a]==45);
    m.nack_addr=0x14;assert(motion_read(&motion,&count,&activity)==-EIO);
}
static bool oled_pins[4];static unsigned pixels;static bool sleeping=true,fail_spi;
static int pin(enum oled_pin p,bool high)
{
    if(p==OLED_POWER && !high) { assert(sleeping && !oled_pins[OLED_RESET] && !oled_pins[OLED_DC] && !oled_pins[OLED_CS]); }
    oled_pins[p]=high;return 0;
}
static int spi_write_mock(const uint8_t *d,size_t n)
{
    assert(oled_pins[OLED_POWER] && oled_pins[OLED_RESET] && !oled_pins[OLED_CS]);
    sleeping=false;(void)d;
    if(fail_spi) { return -EIO; }
    if(oled_pins[OLED_DC]) { pixels+=n; }
    return 0;
}
static int sleep_pins(void) { sleeping=true;return 0; }
static void sleep_ms(uint32_t ms) { (void)ms; }
static void test_oled_power(void)
{
    const struct oled_io io={.pin=pin,.write=spi_write_mock,.sleep_pins=sleep_pins,.delay_ms=sleep_ms};
    struct oled o;
    assert(oled_init(&o,&io,48)==-EINVAL);
    assert(!oled_init(&o,&io,64));
    assert(!oled_text(&o,"STEPS 12345678901234567890","KM 1.000","BAT 75%","PAIR 000001"));
    assert(o.active && pixels==1024);
    assert(!oled_off(&o) && !o.active && !oled_pins[OLED_POWER]);
    pixels=0;assert(!oled_init(&o,&io,32));
    assert(!oled_text(&o,"A","B","C","D") && pixels==512);
    fail_spi=true;
    assert(oled_text(&o,"FAIL","","","")==-EIO && !o.active && !oled_pins[OLED_POWER]);
}
int main(void)
{
    test_steps();test_clock_and_protocol();test_pmic_faults();
    test_gauge_faults();test_motion_reset();test_oled_power();
    puts("PASS: steps/rollover, clock/protocol, PMIC faults, gauge faults, Bosch driver, OLED power sequencing");
    return 0;
}
