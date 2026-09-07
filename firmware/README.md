# Bluetooth pedometer firmware

Zephyr application for the R4 CC2340R53N0RKPR board. It initializes the 3.0 V
rail, configures BMA400 hardware step counting, saves totals, drives a switched
SSD1306 SPI display and exposes an authenticated BLE service. Firmware builds
and host tests are verified; no assembled-board flashing or physical testing
has been performed.

## Build

From the repository root with Python 3.9, Git and Clang (verified on macOS arm64;
the setup also selects SDK packages for Linux and x86_64):

```sh
python3 firmware/setup.py
python3 firmware/tests/run.py
python3 firmware/build.py
firmware/.venv/bin/python firmware/tests/check_image.py
```

Setup installs tools under `firmware/.venv` and downloads pinned TI SimpleLink
Zephyr, its four required modules and the ARM toolchain under `.deps`. It checks
SDK downloads against the official release SHA-256 list. The already vendored
Bosch API retains its license and upstream commit. No vendor source is patched.

The official TI HAL selects generated radio/clock support by its board ID, so
the build target is `lp_em_cc2340r53`. **The hardware definition is the required
[`app.overlay`](app.overlay)**: it replaces LaunchPad pins, removes LEDs, keys,
external flash and the MCUboot slots, and disables UART/ADC/PWM. The actual
application starts at flash address zero with 496 KiB code and 16 KiB settings.
The compiler target name does not mean this firmware uses LaunchPad wiring.
TI's SPI driver requires SCK, MOSI and MISO pin entries even for a transmit-only
display. MISO uses the board's unused DIO25 with a pull-down; it is not connected
to J3. CS remains under application GPIO control on DIO11.

Artifacts are `firmware/build/zephyr/zephyr.hex` and `zephyr.elf`. Use HEX or ELF,
which include TI's CRC-populated CCFG at `0x4e020000`. Do not flash the raw BIN
alone. The image checker verifies HEX/ELF agreement, vector table, active GPIO
mapping and flash boundaries. Dependencies and build outputs are ignored by Git.

For a 128×32 module:

```sh
python3 firmware/build.py --conf firmware/oled32.conf --build-dir firmware/build-oled32
```

Default display: a **3.0 V-compatible 128×64 SSD1306 SPI module** on J3.
J3 pin order is GND, VCC, SCLK, MOSI, RESET, D/C, CS. Module supply/charge-pump
requirements and pin order must be checked against the actual module; neither
SH1106 nor an I2C-only display is supported by this firmware. Passkey pairing
requires a working display.

## Flash and first power-on

Follow [`FIRMWARE_BRINGUP.md`](../FIRMWARE_BRINGUP.md) for current-limited power,
rail checks and battery polarity. J1 USB is power only. Program via J4 SWD:
VREF, SWDIO, SWCLK, RST, GND. Use a target-voltage-aware probe: VCORE starts at
1.8 V and rises to 3.0 V. J4 VREF is a sense input to the probe, not a supply.

With SEGGER J-Link software installed and a probe connected, run explicitly:

```sh
cd firmware/.deps
PATH="../.venv/bin:$PATH" ../.venv/bin/west flash -d ../build --runner jlink --skip-rebuild
```

Alternatively load `zephyr.hex` through a CC2340R53-compatible SWD programmer.
The provided build script never flashes automatically. Firmware updates through
SWD should preserve the settings region if bonds/counts are to be retained.
Mass erase clears them. SWD remains enabled; this application does not lock
debug, install a bootloader or provide OTA update.

## Controls

SW2 / VIEW actions happen **when the button is released**:

| Hold | Action |
| --- | --- |
| 40 ms–under 2 s | Show steps, distance, battery and status |
| 2–under 5 s | Open a 60-second pairing window |
| 5–under 8 s | Reset the logical step total and save |
| 8 s or longer | Save and enter ship/off; unplug USB first |

SW1 / POWER remains the PMIC's hardware wake/reset button. From ship, hold it
for at least 2 seconds or connect USB. Its long-press reset is independent of
the application's save operation and can lose uncheckpointed steps.

On boot the display is shown for 10 seconds. It switches off after its timeout,
with SPI suspended and control signals low to prevent back-powering. Holding
the pairing window open keeps the display available for the six-digit passkey.

## Tracking and persistence

The BMA400 operates at 100 Hz, ±4 g, OSR 0, in normal mode. Step totals are
read every 5 seconds; the MCU does not wake for every step. The default Bosch
non-wrist parameters suit a clip/pocket placement. Set `CONFIG_PEDOMETER_WRIST=y`
for the documented wrist parameters and validate in the intended worn position.

The application handles 24-bit counter rollover, sensor resets and implausible
jumps. An unannounced reset/jump sets the sample-gap status bit until a count
reset or daily rollover. Totals and stride are checkpointed to NVS every five
minutes and on explicit reset, stride change or ship. Sudden loss of power,
watchdog reset or SW1 reset can lose up to five minutes of unsaved counts; the
first sensor reading after MCU boot establishes a fresh baseline.

Default stride is 750 mm and is user configurable. Distance is an estimate from
steps × stride, saturated at the uint32 limit. Sending time enables daily reset
at the next local midnight (within the five-second sampling interval). Time
sync itself preserves the count. Time-zone offset is explicit, without automatic
DST rules. Wall time is invalid after MCU reset and must be resynchronized;
steps continue accumulating until then. This board has no backed-up wall clock.

## BLE protocol v1

Advertisements use the name `BLE Pedometer` and the service UUID only; no counts,
history or battery data are advertised. Interval is 1.0–1.2 seconds. Privacy and
bond persistence are enabled; up to two peers can bond, with one connection at
a time. An unauthenticated connection outside a pairing window is disconnected
after 30 seconds. Existing bonded peers can reconnect without opening a window.

1. Hold VIEW for 2–under 5 seconds and release.
2. Connect using a phone BLE GATT client. Read telemetry or enable notifications
   to request security/pairing.
3. Enter the six-digit passkey shown on the OLED into the phone's pairing dialog.
4. Read or subscribe to telemetry; write control commands on the same connection.

Reads, notifications and controls require authenticated encryption. Pairing is
LE Secure Connections only. A generic GATT client is sufficient; this does not
register as a phone OS health-provider application automatically.

| Attribute | UUID | Access |
| --- | --- | --- |
| Service | `c2a10001-6a9b-4e31-9d42-7b680ca4c901` | Discover |
| Telemetry | `c2a10002-6a9b-4e31-9d42-7b680ca4c901` | Authenticated read / notify |
| Control | `c2a10003-6a9b-4e31-9d42-7b680ca4c901` | Authenticated write with response |

Telemetry is exactly **20 bytes**, all multi-byte numbers little-endian:

| Offset | Type | Meaning |
| --- | --- | --- |
| 0 | uint32 | Steps since last reset |
| 4 | uint32 | Distance, mm |
| 8 | uint32 | MCU uptime, seconds |
| 12 | uint16 | Battery voltage, mV; 0 if unavailable |
| 14 | uint8 | SOC percent; **255 means unavailable**, not empty |
| 15 | uint8 | Status flags below |
| 16 | uint16 | Stride, mm |
| 18 | uint8 | Bosch activity: 0 still, 1 walking, 2 running |
| 19 | uint8 | Protocol version, currently 1 |

Status bits: `0x01` sensor healthy, `0x02` PMIC verified, `0x04` battery reading
valid, `0x08` SOC valid, `0x10` charging permitted, `0x20` time synchronized,
`0x40` last save failed, `0x80` sample gap detected. Charging permitted is not a
claim that current is flowing: USB, temperature, charger state and battery
voltage determine that. The flags report firmware observations, not analog
measurements of VCORE or display presence.

Control packets:

| Bytes (hex) | Action |
| --- | --- |
| `01` | Show display |
| `02` | Reset and save steps |
| `03` | Save and ship/off; refused while USB is present |
| `04 LL HH` | Set stride, uint16 mm, 100–2000; `04 EE 02` = 750 mm |
| `05 S0 S1 S2 S3 T0 T1` | Set Unix seconds (uint32) and UTC offset in minutes (int16, −720…840) |

Commands reject incorrect lengths, offsets, unsupported opcodes and invalid
values. Successful GATT write means **queued**, not completed: hardware work
runs on the main thread. Read telemetry to confirm changes; a storage failure
sets `0x40`. The command queue holds eight requests. Notifications update when
the telemetry changes, normally once per second, with step values sampled every
five seconds. No unbounded history or phone-side sync app is included.

## Battery and recovery

**Default charging is inhibited.** The device can run on USB or a precharged,
protected single-cell battery. Voltage is reported without claiming calibrated
SOC. This is intentional until the actual battery and NTC are specified.

Copy [`battery.example.conf`](battery.example.conf), set values from the cell
data sheet, and only then enable `CONFIG_PEDOMETER_BATTERY_PROFILE_APPROVED=y`.
This implementation supports a verified **4.2 V Li-ion profile, chemistry ID
1202**, 100–500 mAh configured capacity, 5–50 mA fast charge and a termination
current of at least 0.5 mA. This chemistry must match the actual cell; voltage
alone does not establish a chemistry match. The gauge profile and charger
registers are read back before /CE goes low. A missing or unconfigurable gauge
keeps charging inhibited.

The USB input limit is 100 mA; it is separate from the battery charge current.
The hardware charger safety timer is six hours and is never disabled. At very
low charge current, it may stop before a large cell reaches full charge; choose
the current with the actual pack limits and required charge duration in mind.
NTC thresholds assume the board's 10 kΩ parallel resistor and must be verified
with the selected thermistor. Neither hardware protection nor cell validation
is replaced by the firmware profile flag.

PMIC settings are verified every ten seconds, servicing its 50-second watchdog.
On readback failure, firmware inhibits charging, powers off the display and
reconfigures the rail. Battery removal and I2C NACK do not block step tracking.
An asynchronous I2C transfer has a one-second timeout. TI's driver has no cancel
API, so timeout inhibits charging and resets the MCU before pending buffers can
expire. The eight-second hardware watchdog also recovers stalled SPI/application
work. Startup GPIO hogs bias /CE high and OLED off before main executes.

## Validation

`tests/run.py` executes the production core and drivers using mocked register
buses under AddressSanitizer and UndefinedBehaviorSanitizer. It covers step
rollover/reset/saturation, clock midnight and timezone boundaries, 8,192 opcode/
length combinations, telemetry encoding, charger validation and readback faults,
gauge absence/POR/checksum/SOC errors, the actual Bosch SensorAPI and display
power sequencing, both display heights and SPI failures.

The target build also exercises Zephyr, TI's BLE controller, GPIO/I2C/SPI,
watchdog, NVS and CCFG generation. These software checks do not emulate RF or
the analog board. First-article acceptance still requires verifying boot VCORE,
charging/NTC cutoffs, actual OLED compatibility, BLE pairing/range, step accuracy,
reset recovery and battery current/runtime on assembled hardware.

References: [TI SimpleLink Zephyr](https://github.com/TexasInstruments/simplelink-zephyr),
[Bosch SensorAPI](https://github.com/boschsensortec/BMA400_SensorAPI),
[BQ25150](https://www.ti.com/lit/ds/symlink/bq25150.pdf),
[BQ27427 technical reference](https://www.ti.com/lit/ug/sluucd5/sluucd5.pdf).
