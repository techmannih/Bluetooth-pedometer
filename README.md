# Bluetooth Pedometer

A compact, rechargeable Bluetooth pedometer reference design written in
[tscircuit](https://tscircuit.com/). The board combines a TI CC2340R5 BLE 5.3
MCU, Bosch BMA400 always-on accelerometer, TI BQ25150 wearable charger/power
manager, TI BQ27427 fuel gauge, and a switched SPI connector for a small
SSD1306 OLED module.

The design source is [`index.circuit.tsx`](./index.circuit.tsx). It generates a
48.2 mm x 34 mm, 1 mm-thick, 4-layer PCB. Standard passives use native
tscircuit resistor/capacitor/inductor/diode elements; their exact supplier land
patterns are resolved with native `footprint="jlcpcb:C..."` references.
Geometry-sensitive parts use raw JLCPCB imports. All 59 fitted parts retain
locked LCSC codes—33 unique orderable codes—and resolved OBJ/STEP models. See
[`JLCPCB_PARTS.md`](./JLCPCB_PARTS.md) and [`BOM.csv`](./BOM.csv).

## Architecture

```text
USB-C 5 V -> protection/filter -> BQ25150 -> 3.0 V VCORE -> CC2340R5
                                     |             |       BMA400
protected 1S LiPo -> BQ27427 --------+             +-----> switched OLED
                    fuel gauge                     +-----> I2C pull-ups

BLE phone link <----------------------------------- CC2340R5
```

The BMA400, charger, and fuel gauge share I2C. The OLED has its own SPI bus and
its supply is disconnected by a TPS22918 when the screen is not being viewed.
That separation avoids powering an "off" display through shared bus pull-ups.

## Key choices

| Function | Part | Reason |
| --- | --- | --- |
| BLE MCU | CC2340R53N0RKPR (C45190532) | BLE 5.3, low-power modes, enough GPIO, integrated DC/DC |
| Motion | BMA400 | sub-uA low-power acquisition and hardware step/activity features |
| Charger/power path | BQ25150YFP | wearable-oriented charger, power path, programmable load-switch/LDO rail |
| Fuel gauge | BQ27427YZF | integrated high-side current sensing for a single Li-ion cell |
| Display switch | TPS22918DBV | disconnects and actively discharges the OLED rail |
| Antenna | Johanson 2450AT18A100E (C89334) | small 2.4 GHz ceramic antenna with a tuneable feed |

## Electrical interfaces

### Shared I2C bus

| Device | Bus/address | CC2340R5 pin | Other connections |
| --- | --- | --- | --- |
| BMA400 | I2C, `0x14` (`SDO=0`) | SDA DIO0; SCL DIO24 | INT1 DIO18, INT2 DIO20 |
| BQ25150 | I2C, `0x6B` | SDA DIO0; SCL DIO24 | INT DIO9, PG DIO22, LP DIO14 |
| BQ27427 | I2C, `0x55` | SDA DIO0; SCL DIO24 | GPOUT DIO10 |

R10 and R11 are 10 kOhm pull-ups to VCORE. This value favors battery life; if
bus rise time is too slow with the assembled harness and display, populate a
lower value after measuring bus capacitance.

### OLED SPI connector J3

J3 is the exact JLCPCB-imported PZ200V-11-07P (C541861), a 2.0 mm-pitch,
7-pin connector for a 3.0 V-compatible SSD1306 SPI module. Module pin orders
are not standardized; verify the cable before use.

| J3 pin | Signal | CC2340R5 pin |
| --- | --- | --- |
| 1 | GND | — |
| 2 | switched OLED_VCC | — |
| 3 | SCLK | DIO8 |
| 4 | MOSI | DIO19 |
| 5 | RESET | DIO13 |
| 6 | D/C | DIO12 |
| 7 | CS | DIO11 |

OLED power enable is DIO21. R14 keeps the switch off during reset and C24
controls the turn-on slew rate.

### Debug and battery connectors

J4 is the exact PZ200V-11-05P (C541859) 2.0 mm-pitch SWD header:
`3V, SWDIO, SWCLK, RST, GND`.

J2 is an exact JLCPCB-imported 3-pin JST-PH battery connector (C131339):
`CELL+, 10k NTC, GND`. J5 is an exact JLCPCB-imported 4-pin JST-SH service
connector (C160390): `CHARGER_IN, BAT_PACK_POS, VCORE, GND`. These and every
other fitted component include an exact supplier code, exact supplier-resolved
land pattern, and OBJ/STEP CAD model metadata. Use only a
protected, rechargeable single-cell Li-ion/LiPo pack whose regulation voltage
and safe charge current are known. The connector polarity must be checked
against the selected battery because premade JST battery cables are not
universally wired the same way.

## Power strategy and expected runtime

The BQ25150 LSLDO rail starts at its reset default of 1.8 V. Early firmware must
write `LDOCTRL (0x1D) = 0xE0` to select 3.0 V before enabling the display or
starting normal application work. R3 is 1.2 kOhm, setting an approximately
51 mA hardware input-current ceiling. Charge current and regulation voltage
still have to be programmed for the exact cell.

A sensible firmware target is 30–80 uA average with the display normally off,
short BLE advertisements/connections, the BMA400 doing step detection, and the
fuel gauge allowed to sleep. At that range, an ideal 100 mAh cell corresponds
to roughly 7–20 weeks. Real runtime will be lower after cell self-discharge,
temperature, conversion losses, radio conditions, display use, and reserve
capacity are included. Measure an assembled unit over its complete use cycle
before setting a product claim.

## Build and inspect

```sh
bun install
bun run typecheck
bun run build
bun run dev
```

The generated circuit JSON is written under `dist/index/`. `bun run dev` opens
the interactive schematic/PCB/3D view.

The JLCPCB catalog selection was checked on 2026-09-05. Availability and
assembly tier are live data; recheck every LCSC code immediately before placing
an order. Locked supplier references remove CAD/BOM ambiguity, but do not
replace electrical, DFM, RF, or first-article validation.

## Important release gates

This is an engineering reference design, not a production-released medical or
safety device. Before ordering production boards:

1. Complete the checks in [`FABRICATION_NOTES.md`](./FABRICATION_NOTES.md).
2. Set charger voltage/current from the selected cell manufacturer's limits.
3. Confirm the BQ27427 chemistry profile and characterize its state-of-charge
   accuracy on that cell.
4. Validate the imported CC2340R5, BQ25150, BQ27427, and BMA400 land patterns
   against manufacturer package drawings and assembler capabilities.
5. Tune the antenna match with a VNA in the final enclosure and complete the
   required regional radio/EMC certification.
6. Validate battery protection, temperature cutoff, abnormal charging, ESD,
   mechanical strain, and enclosure clearances.

## Primary design references

- [TI CC2340R5 data sheet](https://www.ti.com/lit/ds/symlink/cc2340r5.pdf)
- [TI BQ25150 data sheet](https://www.ti.com/lit/ds/symlink/bq25150.pdf)
- [TI BQ27427 data sheet](https://www.ti.com/lit/ds/symlink/bq27427.pdf)
- [Bosch BMA400 product page and data sheet](https://www.bosch-sensortec.com/en/products/motion-sensors/accelerometers/bma400/)
- [TI TPS22918 data sheet](https://www.ti.com/lit/ds/symlink/tps22918.pdf)
- Verify the locked 2450AT18A100E antenna data sheet and reference layout from
  Johanson before RF release; it is not footprint/RF-equivalent by assumption.
