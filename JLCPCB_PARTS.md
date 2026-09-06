# JLCPCB/LCSC Parts Lock

Every fitted source component in `index.circuit.tsx` has a locked JLCPCB/LCSC
code. Standard passives use native tscircuit elements with standard footprints
(`res0402`, `cap0402`, etc.); ICs, connectors, switches,
crystals, the ferrite bead, and antenna use raw JLCPCB imports where exact
geometry matters. All 59 fitted parts have supplier codes, representing 33
unique orderable part numbers. Generic passive footprints/models are not
claimed identical to the supplier package; compare pad geometry before release.

Catalog availability was checked on 2026-09-05. Stock and assembly tier can
change, so recheck all codes in the JLCPCB order flow before purchase.

## Complete-import audit — 2026-09-06

All 15 component files were compared against fresh output from the installed,
unmodified CLI (`@tscircuit/cli` 0.1.2021), using
`tsci import --jlcpcb --use-exact-footprint <LCSC-code>` in an isolated directory.
This checks completeness against that importer, not independent datasheet
accuracy, current assembly stock, or 3D-model alignment.

| Imports | Result |
| --- | --- |
| U1 CC2340R5; U2 BQ25150; U3 BQ27427; U4 BMA400 | Already match complete imports, including all supplied pin labels/attributes, footprint and CAD metadata. These imports do not supply custom symbols. |
| U5 TPS22918; SW1/SW2 SKRPACE010; Y2 ABS07 | Already match the importer's native `switch`, `pushbutton`, and `crystal` elements respectively. No imported custom symbol was removed. |
| FB1 BLM18 | Already matches the complete import, including its custom symbol. |
| AE1 antenna | Complete footprint, CAD and symbol strokes retained; horizontal label correction recorded below. |
| J2 B3B-PH | Restored the complete footprint: exact hole coordinates, body silkscreen, pin-1 marker, reference label and courtyard, plus the original pin labels and `chip` wrapper. |
| J1 USB-C; J3/J4 PZ200 headers; J5 JST-SH | Restored the original `chip` wrappers and footprint declarations; no replacement symbol invented. J1 exceptions are recorded below. |
| Y1 ABM11W | Complete four-pin custom symbol, ground requirements, footprint and CAD retained; alias correction recorded below. |

Nine files match fresh imports exactly apart from the final newline.
Six retain deliberate, documented local corrections:

- Y1: use unique `GND1`/`2` and `GND2`/`4` port aliases. The importer's shared
  `GND` alias caused a missing-pin error in the installed core. Both ground
  pins still connect to GND and retain `requiresGround`. The user's explicit
  0.02 mm symbol stroke widths are also retained.
- J1: remove duplicate consecutive/closing polygon vertices from pads 13–16
  without changing their copper outlines. Preserve the user's CAD-origin
  adjustment (Y = -2.3500289000000517 instead of -2.7500289000000517); this is
  not a claim that the model alignment has been mechanically verified.
- J2 B3B-PH and J3/J4 PZ200V: add `insertionDirection="from_above"` to the
  complete imported footprint. These are vertical mating connectors; this
  corrects the in-plane orientation check without changing copper, holes,
  body, courtyard, symbol or CAD data. See the
  [JST PH series drawing](https://www.jst-mfg.com/product/pdf/eng/ePH.pdf) and
  [XFCN PZ200V-11 family drawing](https://datasheet.lcsc.com/lcsc/2409302300_XFCN-PZ200V-11-04P_C541858.pdf).
- AE1: move `ANT` from the auto-rendered vertical pin alias to an explicit
  horizontal `schematictext` above the complete imported antenna symbol.
  The feed is addressed as physical `pin1` in the symbol and board connection;
  pin 2 remains unconnected. Copper, routing, symbol strokes and CAD are unchanged.

The board places J2 at (-18, -12.8) mm so its restored body/courtyard stays
inside the outline. Its physical wiring remains pin 1 BAT+, pin 2 NTC,
pin 3 GND; the board silkscreen carries these meanings. No imported
footprint was trimmed to make placement pass. Standard native passives and
their locked supplier codes are unchanged.

For future imports, retain the complete generated element, symbol (if
provided), pin data, footprint and CAD metadata. A `chip` wrapper is not
itself evidence of an incomplete import: it can contain a custom `symbol`,
or use the default pin-labelled IC/connector representation if the importer
supplies no custom one. Record necessary corrections instead of silently
dropping imported data.

## Locked parts

| LCSC code | Manufacturer part number | Used for |
| --- | --- | --- |
| C45190532 | CC2340R53N0RKPR | U1 BLE MCU |
| C2868498 | BQ25150YFPR | U2 charger/power manager |
| C6075475 | BQ27427YZFR | U3 fuel gauge |
| C437655 | BMA400 | U4 accelerometer |
| C131941 | TPS22918DBVR | U5 OLED load switch |
| C165948 | TYPE-C-31-M-12 | J1 USB-C receptacle |
| C131339 | B3B-PH-K-S(LF)(SN) | J2 JST-PH battery connector |
| C541861 | PZ200V-11-07P | J3 OLED header |
| C541859 | PZ200V-11-05P | J4 SWD header |
| C160390 | BM04B-SRSS-TB(LF)(SN) | J5 JST-SH service connector |
| C139797 | SKRPACE010 | SW1, SW2 tact switches |
| C2827694 | PESD5V0S1BA | D1 USB TVS |
| C80165 | BLM18PG221SN1D | FB1 ferrite bead |
| C2831366 | SLM1608100MIT | L1 10 uH DC/DC inductor |
| C206433 | LQP03TN2N8B02D | L2 2.8 nH RF inductor |
| C89334 | 2450AT18A100E | AE1 2.4 GHz antenna |
| C1985532 | ABM11W-48.0000MHZ-7-B1U-T3 | Y1 48 MHz crystal |
| C179635 | ABS07-32.768KHZ-9-T | Y2 32.768 kHz crystal |
| C25905 | 0402WGF5101TCE | R1, R2 5.1 kOhm |
| C2909307 | FRC0402F1201TS | R3 1.2 kOhm |
| C25744 | 0402WGF1002TCE | 10 kOhm resistors |
| C25741 | 0402WGF1003TCE | 100 kOhm resistors |
| C17168 | 0402WGF0000TCE | R13 0 Ohm |
| C26083 | 0402WGF1004TCE | R14 1 MOhm |
| C1705 | CL10A475KP8NNNC | 4.7 uF capacitors |
| C1691 | CL10A106MQ8NNNC | 10 uF capacitors |
| C52923 | CL05A105KA5NQNC | 1 uF capacitors |
| C1525 | CL05B104KO5NNNC | 100 nF capacitors |
| C12530 | CL05A225MQ5NSNC | C6, C8 2.2 uF |
| C1547 | 0402CG120J500NT | C18 12 pF C0G |
| C1548 | 0402CG150J500NT | C19 15 pF C0G |
| C161414 | GRM0335C1H1R5BA01D | C20, C21 1.5 pF C0G |
| C1523 | 0402B102K500NT | C24 1 nF |

## Availability-driven substitutions

These parts replace earlier generic or unavailable choices while preserving the
required electrical role. They must still be validated on first articles.

| Earlier choice | Locked JLCPCB part | Engineering note |
| --- | --- | --- |
| CC2340R5RKP family name | CC2340R53N0RKPR, C45190532 | exact orderable suffix and RKP footprint |
| PESD5V0S1UL | PESD5V0S1BA, C2827694 | 5 V bidirectional SOD-323 TVS |
| LQM18PN100MFRL | SLM1608100MIT, C2831366 | 10 uH 0603; verify current/ripple margin |
| 2.8 nH generic | LQP03TN2N8B02D, C206433 | exact 0201 RF inductor |
| 2450AT18A0100001E | 2450AT18A100E, C89334 | alternate Johanson antenna; VNA tuning is mandatory |
| TZ3908AAAO43 | ABM11W-48.0000MHZ-7-B1U-T3, C1985532 | 48 MHz, 7 pF, four-pad crystal |
| generic 2.0 mm headers | PZ200V-11-07P / -05P | exact JLCPCB THT parts for J3/J4 |

`BOM.csv` is the placement-level BOM. Geometry-sensitive TypeScript wrappers
and exact footprints/models are under `imports/`, with `imports/JlcParts.ts` as
the barrel used by the board source. Native passives keep their MPN and LCSC
code directly on each tscircuit element. The user's native-footprint changes
were preserved during the R2 review.
