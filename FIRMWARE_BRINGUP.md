# Firmware Bring-up

## Safe first boot

1. Power from a current-limited 5 V bench supply through USB-C with no battery
   and no OLED attached. Start with a 20 mA limit.
2. Confirm VCORE starts near 1.8 V. J4 pin 1 is target-voltage sense, not a
   programmer power input: use an SWD probe that follows the target's 1.8–3.0 V
   rail. Never force 3.3 V into VCORE.
3. Set DIO1 (/CE) high to inhibit charging and DIO21 (OLED_EN) low. R5 now
   pulls /CE up while VCORE is present. Set DIO14 (/LP) high and wait at least
   1 ms before PMIC I2C accesses; start I2C at 100 kHz.
4. Read BQ25150 and BMA400 identity/status. The cell-side BQ27427 can be
   unpowered with no battery, so its NACK here is expected, not a reason to
   fail boot or spin forever. Use bounded I2C timeouts and log errors.
5. Program `BQ25150 LDOCTRL (0x1D) = 0xE0` for a 3.0 V VCORE rail, then verify
   VCORE at J5 pin 3 before raising the bench-supply limit.
6. Keep DIO21/OLED_EN low. Drive OLED SPI pins low or high-impedance whenever
   the OLED rail is off.
7. Program BQ25150 charge regulation voltage, charge current, termination,
   safety timer, watchdog, and temperature thresholds for the selected pack.
   Read settings back before allowing DIO1 low. Keep ICHARGE_RANGE=0 for the
   intended small-cell range; R3 limits the charge register code, not USB input
   current. Program the USB input-current limit independently. Do not infer a
   cell's safe charge rate from capacity alone.
8. Attach a verified pack with charging still inhibited; read the BQ27427 and
   configure the selected chemistry, capacity and termination parameters.
   Check polarity and current sign with a known load before trusting SOC.
9. Configure BMA400 normal mode, OSR=0 and 100 Hz for initial step-counter
   validation. Advanced step counting is unavailable in 25 Hz low-power mode.
   Enable step counting, but avoid waking the MCU for every step: burst-read
   the three counter bytes periodically or on display/sync. Handle 24-bit
   rollover separately from sensor reset. Use push-pull interrupt outputs
   since INT1/INT2 have no external pull-ups. Start with the manufacturer's
   wrist/non-wrist configuration matching the enclosure location.
10. Enable charging only after configuration/readback and pack checks pass.
    Observe charging, termination,
    thermal behavior, and gauge accumulation at minimum and maximum allowed
    temperatures.

## Suggested application state machine

```text
SHIP/OFF --MR or USB--> BOOT -> CONFIGURE -> TRACKING
                                      |          |
                                      |          +-- BMA400 interrupt -> update steps
                                      |          +-- periodic BLE advertise/sync
                                      |          +-- button -> DISPLAY
                                      |                         |
                                      +<------------------------+

TRACKING --explicit power-off / storage command--> SHIP/OFF
```

### Tracking state

- Let the BMA400 count steps and wake the MCU in batches rather than handling
  every sample in software.
- Advertise a compact service payload infrequently; open a connection only for
  synchronization or configuration.
- Cache step totals in RAM and checkpoint nonvolatile state sparingly to limit
  flash energy and wear.
- Allow the BQ27427 to enter its low-current state between gauge reads.
- Check open-drain status/interrupt levels before sleeping: R6 and R7 are
  now 100 kOhm, so each asserted status pull consumes approximately 30 uA at
  3 V. I2C R10/R11 remain 10 kOhm (300 uA when low). Acknowledge clearable
  interrupt sources and budget for any intentionally sustained low status;
  do not assume the MCU sleeping makes these resistor currents disappear.
- Drive DIO14 low between PMIC transactions when running on battery; /LP is
  active-low and the LSLDO rail retains its configured state. Raise it and wait
  at least 1 ms before addressing the PMIC again. Other I2C devices can still
  be used while the PMIC sleeps.
- Do not enter ship mode merely because the wearer is inactive: BMA400 loses
  power and cannot wake the system on motion. Ship mode is explicit off/storage.
- If later adding sensor auto-low-power/auto-wake, measure missed initial steps
  and wake thresholds first. Continuous normal-mode counting is the baseline.
- On MCU reset, bus failure or charger readback mismatch, keep /CE high and
  display off. PMIC reset may return VCORE to 1.8 V: repeat rail setup and
  recover the display, rather than assuming a retained 3.0 V configuration.

### Display state

1. Keep SPI/reset signals low; raise OLED_EN only after confirming VCORE setup.
2. Wait for the TPS22918 ramp and SSD1306 module supply to settle.
3. Hold/reset the display, initialize it, and draw a mostly static frame.
4. Turn it off after a short timeout.
5. Put SPI pins in a non-backpowering state, lower OLED_EN, and confirm the
   active-discharge path brings OLED_VCC down.

## BLE data model

A small custom GATT service is sufficient:

| Characteristic | Type | Access |
| --- | --- | --- |
| Step count | uint32 | read/notify |
| Distance | uint32 millimetres | read/notify |
| Battery state | uint8 percent plus optional mV | read/notify |
| Daily reset time | uint32 Unix seconds | read/write |
| Stride length | uint16 millimetres | read/write |
| Control/status | bitfield | read/write |

Advertise no step history or stable personal identifiers by default. Require
authenticated pairing for settings/time/reset writes; offer an explicit pairing
window. Plan for authenticated firmware update, rollback protection and a
recoverable debug-lock procedure before production.

## Power measurements

Characterize at least these windows separately:

- ship/off current;
- BMA400 tracking with the MCU asleep;
- BLE advertising average at the chosen interval;
- connected synchronization;
- OLED on at minimum and maximum pixel load;
- fuel-gauge polling and flash checkpoint;
- USB charging with the cell at low voltage and near termination.

Use an energy profiler or a current monitor with enough dynamic range to see
sub-uA sleep current and mA radio/display peaks in the same capture.

Also scope /CE, VCORE and battery current during USB insertion, slow ramps,
brownout, MCU reset, watchdog reset and recovery from a flat cell. The /CE
pull-up depends on VCORE: it is not an independent battery safety interlock.
Check LDO startup/stability with the actual OLED module's input capacitor and
worst-case pixel load, including the 1.8-to-3.0 V transition.

C5 is now a 4.7 uF VINLS bypass, matching/exceeding the nominal downstream
on-board capacitance. Account for DC bias and the external display before
approving the rail. R9 remains the recommended 10 kOhm gauge pull-up. Scope /INT and /PG with
the new 100 kOhm pulls at
both 1.8 V and 3.0 V; verify high-level leakage margin and that the interrupt
edge settles within the shortest configured pulse and the MCU input timing.

References: [TI BQ25150, pin functions and low-power mode](https://www.ti.com/lit/ds/symlink/bq25150.pdf),
[Bosch BMA400, interrupt features and step counter](https://www.bosch-sensortec.com/media/boschsensortec/downloads/datasheets/bst-bma400-ds000.pdf).
These are bring-up instructions, not implemented or hardware-tested firmware.
