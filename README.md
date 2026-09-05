# Bluetooth Pedometer

A compact, rechargeable Bluetooth pedometer reference design written in
[tscircuit](https://tscircuit.com/). The board combines a TI CC2340R5 BLE 5.3
MCU, Bosch BMA400 always-on accelerometer, TI BQ25150 wearable charger/power
manager, TI BQ27427 fuel gauge, and a switched SPI connector for a small
SSD1306 OLED module.

The design source is [`index.circuit.tsx`](./index.circuit.tsx). It generates a
48.2 mm x 34 mm, 1 mm-thick, 4-layer prototype PCB. Standard passives use native
tscircuit elements and standard footprints (`res0402`, `cap0402`, etc.), as
requested. Geometry-sensitive parts use raw JLCPCB imports. All 59 fitted parts
retain locked LCSC codes—33 unique supplier codes. Generic passive footprints
and CAD must still be checked against the selected supplier part. See
[`JLCPCB_PARTS.md`](./JLCPCB_PARTS.md) and [`BOM.csv`](./BOM.csv).

**R2 review: not ready to order.** Electrical corrections are implemented, but
RF/clock layout and fabrication-rule closure remain. Read
[`DESIGN_REVIEW.md`](./DESIGN_REVIEW.md) before treating a successful build as
manufacturing approval.

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
| Motion | BMA400 | hardware step counting in normal mode; MCU can sleep between reads |
| Charger/power path | BQ25150YFP | wearable-oriented charger, power path, programmable load-switch/LDO rail |
| Fuel gauge | BQ27427YZF | integrated high-side current sensing for a single Li-ion cell |
| Display switch | TPS22918DBV | disconnects and actively discharges the OLED rail |
| Antenna | Johanson 2450AT18A100E (C89334) | small 2.4 GHz ceramic antenna with a tuneable feed |

## Electrical interfaces

### Shared I2C bus

| Device | Bus/address | CC2340R5 pin | Other connections |
| --- | --- | --- | --- |
| BMA400 | I2C, `0x14` (`SDO=0`) | SDA DIO0; SCL DIO24 | INT1 DIO18, INT2 DIO20 |
| BQ25150 | I2C, `0x6B` | SDA DIO0; SCL DIO24 | INT DIO9, PG DIO22, /LP DIO14, /CE DIO1 |
| BQ27427 | I2C, `0x55` | SDA DIO0; SCL DIO24 | GPOUT DIO10 |

R10 and R11 are 10 kOhm pull-ups to VCORE. This value favors battery life; if
bus rise time is too slow with the assembled board, populate a
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
other fitted component retain an exact supplier code. Native passive land
patterns are not claimed to be identical to supplier land patterns. Use only a
protected, rechargeable single-cell Li-ion/LiPo pack whose regulation voltage
and safe charge current are known. The connector polarity must be checked
against the selected battery because premade JST battery cables are not
universally wired the same way.

## Power strategy and expected runtime

The BQ25150 LSLDO rail starts at its reset default of 1.8 V. Early firmware must
write `LDOCTRL (0x1D) = 0xE0` to select 3.0 V before enabling the display or
starting normal application work. DIO14 must be high for PMIC I2C on battery;
allow at least 1 ms after raising it. DIO1 controls /CE, with R5 biasing it high
while VCORE is present. Keep charging inhibited until the exact cell's settings
have been programmed and read back. R3 limits charge-current code, **not USB
input current**; the ~51 mA nominal ceiling assumes ICHARGE_RANGE=0. See the
[TI BQ25150 data sheet](https://www.ti.com/lit/ds/symlink/bq25150.pdf).

Use `bun run power-budget` for explicit, editable planning assumptions. For
example, a 100 mAh cell with 80% usable capacity, 50 uA battery-side tracking
average and 12 mA additional display current predicts about 8.2 weeks at one
minute of display/day, or 3.6 weeks at ten minutes/day. These are not measured
values. Measure an assembled unit over its complete use cycle before setting
a runtime claim. Keep BMA400 in normal mode for baseline hardware step
counting; ship mode is explicit power-off, not inactivity sleep.

## Project setup

This is a native tscircuit project. Its setup was aligned with a reference
generated by the installed CLI using `tsci init --yes --no-install` on
2026-09-05. The scaffold's registry configuration, ignore rules and start
command were merged into this existing project without replacing the PCB,
imports, locked dependencies or validation scripts. The package entrypoint is
`index.circuit.tsx` (not the initializer's generic `index.tsx` metadata).

From this directory, `bun start` or `bunx tsci dev` opens the project. No second
initialization or conversion is required. Optional AI skill downloads are not
needed to run the circuit; the existing workspace skill remains available.

The `.gitignore` excludes generated dependencies, caches and diagnostics.
Already-indexed files are unaffected: existing staged `node_modules/`,
`.tscircuit/` and `dist/` entries were deliberately left untouched.

## Build and inspect

```sh
bun install
bun run typecheck
bunx tsci check netlist index.circuit.tsx
bunx tsci check schematic-placement index.circuit.tsx
bun run snapshot:update
bunx tsci check placement index.circuit.tsx
bunx tsci check routing-difficulty index.circuit.tsx
bun run build
bun run audit
bunx tsci check shorts dist/index/circuit.json
bun run test
bun run power-budget
bun run dev
```

The generated circuit JSON is written under `dist/index/`. `bun run dev` opens
the interactive schematic/PCB/3D view. `bun run build` now runs the netlist
check first and audits the routed result afterward; a CLI exit alone no longer
counts as a clean design. The separate shorts check is still required.

Availability and assembly tier are live data; this electrical review is not a
fresh stock/assembly quotation. Recheck every LCSC code immediately before
placing an order. Locked supplier references reduce CAD/BOM ambiguity, but do not
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
