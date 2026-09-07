# Footprint, symbol and CAD review — 2026-09-07

**The board is not mechanically signed off.** The earlier connectivity and
import-completeness checks did not establish that every supplier footprint or
3D model matched its manufacturer drawing. This review found and corrected
issues at L1, L2, D1 and J5, and records remaining discrepancies below.

All 59 fitted references / 33 LCSC codes were inventoried. All 33 catalog pages
contain the locked MPN, and their linked manufacturer datasheets were retrieved.
The supplier OBJ meshes for the 18 distinct imported packages were measured;
native passive CAD was generated and measured separately. These measurements
check model envelopes, not every surface, pin registration or STEP solid.
STEP files have not been independently measured. Stock was not approved.

## Corrections applied

| Reference | Finding | Current implementation |
| --- | --- | --- |
| L2, Murata LQP03TN2N8B02D / C206433 | `<inductor>` already produced the correct coil symbol. `res0201` supplied generic pads and resistor CAD; its 1.12 mm overall land span exceeded the RF recommendation below. | Dedicated native-inductor wrapper with two 0.30 × 0.25 mm lands at X = ±0.275 mm. Gap 0.25 mm, overall span 0.85 mm. Supplier OBJ/STEP links replace resistor CAD; measured OBJ body is 0.60 × 0.30 × 0.30 mm. |
| L1, Sunltech SLM1608100MIT / C2831366 | `res0603` supplied generic resistor geometry. The fresh supplier OBJ was also unsuitable as an exact model: 0.50 mm tall versus 0.80 ±0.15 mm in the drawing. | Dedicated native-inductor wrapper, full supplier footprint, and an explicit nominal 1.60 × 0.80 × 0.80 mm JSCAD model. It is a simplified body/contact representation, not a manufacturer STEP model. Native 10 µH coil symbol retained. |
| D1, TECH PUBLIC PESD5V0S1BA / C2827694 | The installed core rendered the native `variant="tvs"` as an ordinary diode. Generic SOD-323 lands were 0.60 × 0.45 mm. | Bidirectional TVS strokes adapted from the complete import, with explicit reference/value labels, stroke widths and vertical/horizontal orientation. Manufacturer lands are 0.80 × 0.80 mm, centres ±1.175 mm, overall 3.15 mm. Supplier CAD retained; OBJ envelope 2.50 × 1.30 × 1.10 mm. |
| J5, JST BM04B-SRSS-TB / C160390 | Imported footprint lacked top-entry mating metadata. | Added `insertionDirection="from_above"`. Copper, holes, symbol and CAD are unchanged. |

Murata's LQP03TN RF recommendation is **a = 0.2–0.3, b = 0.8–0.9,
c = 0.2–0.3 mm** in *Inductors (Coils), O05E*, printed page 294,
[LQP03TN soldering guidance](https://datasheet.lcsc.com/datasheet/pdf/21cc2e6abe84f1c64c93eab152a87fc9.pdf?productCode=C206433).
The new footprint uses the midpoints. Its courtyard extends 0.25 mm beyond
the lands/body. The oversized supplier import was deliberately replaced with
this drawing-based pattern; this is not an untouched import.

L1 dimensions and 150 mA rating are from the
[Sunltech SLM Rev.03 drawing and table](https://datasheet.lcsc.com/datasheet/pdf/44a2909d936e7d9477738400aae55a7a.pdf?productCode=C2831366).
D1's bidirectional function and lands are from pages 1 and 4 of the
[TECH PUBLIC datasheet](https://datasheet.lcsc.com/datasheet/pdf/06f58b771ed562d06871abcfa658c84e.pdf?productCode=C2827694).
C2827694 is TECH PUBLIC; a Nexperia part with the same base MPN is not the
locked supplier part. J5's top entry is shown in the
[JST SH series drawing](https://www.jst-mfg.com/product/pdf/eng/eSH.pdf).

`res0201` is a footprint identifier, not the electrical component type.
Sharing a two-terminal land pattern can be valid, but the generated pads and
CAD must fit the selected component. The installed footprinter does not have
an `ind0201` or `ind0603` generator; simply renaming the string is not a fix.

## Remaining footprint differences

These are measured differences from manufacturer examples, not proof of an
open circuit or an assertion that every alternative land pattern is invalid.
They remain pending assembly/land-pattern review; imported geometry was not
silently replaced merely to make it look identical to a drawing.

| Reference | Current geometry | Manufacturer comparison / pending work |
| --- | --- | --- |
| U1 CC2340R5 | 0.4 mm pitch; perimeter lands 0.200 × 0.665 mm; opposite row centres 4.815 mm; exposed land 3.60 mm square | TI RKP0040B example uses 0.200 × 0.600 mm, row centres 4.80 mm and 3.50 mm exposed land. Review the exposed-pad paste pattern and assembly process as well as copper. |
| U2 BQ25150 | 20 round lands, diameter 0.200 mm on a 0.4 mm grid | Package family/pitch and pin inventory checked. Final YFP land, solder-mask and stencil closure remains pending. |
| U3 BQ27427 | Nine round lands, diameter 0.240 mm on a 0.5 mm grid | TI YZF0009 example specifies 0.245 mm exposed metal. The 0.005 mm difference is small; mask/stencil tolerances still need review. |
| U4 BMA400 | Imported perimeter lands 0.280 × 0.500 mm; opposing pad-row centres 1.750 mm | Bosch section 8.3 has asymmetric lands, including 0.30 × 0.30 and 0.30 × 0.35 mm, within a 1.90 mm overall pattern. The imported footprint is not that recommended pattern. Check its no-via/no-routing regions and solder-mask layout before release. |
| U5 TPS22918 | Lands 1.100 × 0.600 mm, 0.95 mm pitch, opposite row centres 2.700 mm | TI DBV0006A example uses the same pad sizes/pitch but 2.600 mm row separation. Alternate designs are allowed by the drawing; the current one is not an exact copy. |
| J2 JST PH | 2 mm pitch, 1.000 mm holes | JST example uses 0.7 mm holes with its stated tolerance/material guidance. Current larger holes need finished-hole, retention and solder-fill review. |
| J3/J4 XFCN PZ200V | 2 mm pitch, 0.900 mm holes | Supplier family drawing shows Ø0.80 mm holes. Confirm finished-hole tolerances and pin retention with the assembler. |
| Standard R/C parts | Native `res0402`, `cap0402`, `cap0603`, `cap0201` | Correct nominal package families and electrical symbols; these are generic lands, not MPN-specific manufacturer patterns. The current artifact retains 36 supplier-footprint mismatch advisories, including deliberate L2/D1 alternatives. |

References: [TI CC2340R5](https://www.ti.com/lit/ds/symlink/cc2340r5.pdf),
[TI BQ25150](https://www.ti.com/lit/ds/symlink/bq25150.pdf),
[TI BQ27427](https://www.ti.com/lit/ds/symlink/bq27427.pdf),
[Bosch BMA400, revision 2.3](https://www.bosch-sensortec.com/media/boschsensortec/downloads/datasheets/bst-bma400-ds000.pdf),
[TI TPS22918](https://www.ti.com/lit/ds/symlink/tps22918.pdf),
[JST PH](https://www.jst-mfg.com/product/pdf/eng/ePH.pdf),
[XFCN PZ200V family](https://datasheet.lcsc.com/datasheet/pdf/67ee2a64c6a313b3a77058518f80bf10.pdf?productCode=C541859).

## Remaining CAD discrepancies

Measurements below are the unscaled OBJ or native-model envelopes in mm.
Model origin/rotation must be considered separately when checking board seating.

| Reference/model | Measured | Manufacturer comparison |
| --- | --- | --- |
| U5 supplier OBJ | Height 1.648939 | TI DBV package maximum 1.45. This model is not dimensionally accurate. |
| U4 supplier OBJ | 2.00 × 2.00 × 1.02 | Bosch package maximum height 1.00. The model is slightly oversized. |
| U3 supplier OBJ | 1.62 × 1.62 × 0.635 | TI maximum height 0.625; one body axis has maximum 1.61. Treat the mesh as approximate. |
| R1–R15, native `res0402` | 1.00 × 0.50 × 0.50 | Both selected resistor families specify 0.35 ±0.05 mm thickness. Generic CAD is too tall. |
| C1/C2/C4/C5/C9, native `cap0603` | 1.60 × 0.85 × 0.60 | Samsung selected thickness code `8` is 0.80 mm nominal (±0.10). Generic CAD is too short. |
| Y2 and SW1/SW2 supplier OBJ | Heights 0.91 and 2.51, including a -0.01 mm lower surface | Nominal/drawing heights are 0.90 and 2.50. Small mesh offsets remain; do not use for tight enclosure tolerances. |
| J1/J3/J4 supplier OBJ | Includes below-board metal | Overall mesh height is not the above-board height. Board seating, mating envelope and pin registration remain pending. J1's existing local CAD-origin adjustment is preserved. |

Resistor thickness sources:
[UniRoyal 0402 family](https://datasheet.lcsc.com/datasheet/pdf/0a975aaa49b7c97f38a963127be4a823.pdf?productCode=C25905),
[FOJAN FRC family](https://datasheet.lcsc.com/datasheet/pdf/106fb934f95f063b695dad1b31b1eab8.pdf?productCode=C2909307).
Capacitor dimensions: [Samsung MLCC catalog, dimensions and thickness coding](https://datasheet.lcsc.com/datasheet/pdf/02336ea48ea44ca18c72517dd3cb7b47.pdf?productCode=C1705).
Other drawings: [Abracon ABS07](https://datasheet.lcsc.com/datasheet/pdf/c9586a2d2c4cd5a5d88cd317e9f784f1.pdf?productCode=C179635),
[Alps SKRP](https://datasheet.lcsc.com/datasheet/pdf/0d81285c392e478b95c7e9b3b68f85ec.pdf?productCode=C139797).

## Inventory coverage

The following covers all 33 supplier codes. “Retained” means the reviewed
representation is still present; it does not certify every mechanical detail.
The complete reference-to-code mapping is in [BOM.csv](./BOM.csv).

| LCSC code(s) | Reference(s) / package | Symbol and model status |
| --- | --- | --- |
| C45190532 | U1, RKP-40 + exposed pad | Pin-labelled chip; imported CAD retained. Land differences above. |
| C2868498 | U2, YFP-20 | Pin-labelled chip; imported CAD retained, 2.00 × 1.60 × 0.60 envelope. Land/stencil closure pending. |
| C6075475 | U3, YZF-9 | Pin-labelled chip; approximate CAD and land difference above. |
| C437655 | U4, LGA-12 | Pin-labelled chip; footprint/CAD discrepancies above. |
| C131941 | U5, SOT-23-6 | Six-pin chip with VIN/GND/ON/CT/QOD/VOUT; footprint/CAD discrepancies above. |
| C165948 | J1, TYPE-C-31-M-12 | USB connector symbol with all physical pad aliases; imported model retained, mechanical registration pending. |
| C131339 | J2, JST PH-3 | Pin-labelled connector; top-entry metadata; 7.90 × 4.50 mm body/model envelope in plan. Hole review above. |
| C541861, C541859 | J3/J4, 7/5-pin 2 mm headers | Pin-labelled connectors; top entry. Hole and model-seating review above. |
| C160390 | J5, JST SH-4 | Pin-labelled connector; top entry corrected. Imported 1 mm pitch and two mechanical pads retained. |
| C139797 | SW1/SW2, SKRPACE010 | Native pushbutton; four pads with paired terminals retained. Model height note above. |
| C2827694 | D1, SOD-323 | Bidirectional symbol, drawing-based lands and supplier model corrected/retained as described above. |
| C80165 | FB1, BLM18 0603 | Imported ferrite symbol and footprint; 1.60 × 0.80 × 0.50 model envelope. |
| C2831366 | L1, SLM1608 0603 | Native coil, supplier footprint, nominal JSCAD replacement. |
| C206433 | L2, LQP03TN 0201 | Native coil, manufacturer RF lands, supplier model. |
| C89334 | AE1, 2450AT18A100E | Imported antenna symbol, feed pin 1 / NC pin 2; 3.20 × 1.60 × 1.30 model envelope. RF layout/tuning remains separate. |
| C1985532 | Y1, ABM11W | Complete four-pin crystal symbol with unique grounded-case aliases; model 2.05 × 1.65 × 0.46. |
| C179635 | Y2, ABS07 | Native two-terminal crystal; imported lands and model retained. |
| C25905, C2909307, C25744, C25741, C17168, C26083 | R1–R15, 0402 | Native resistor symbols, generic pads/CAD; height mismatch above. |
| C1705, C1691 | C1/C2/C4/C5/C9, 0603 | Native nonpolar capacitors; generic pads/CAD, height mismatch above. |
| C52923, C1525, C12530 | Samsung 0402 capacitors | Native nonpolar capacitors; generic 1.00 × 0.50 × 0.50 models and pads retained. |
| C1547, C1548, C1523 | C18/C19/C24, 0402 | Native nonpolar capacitors; generic 0402 models/pads retained. |
| C161414 | C20/C21, Murata 0201 | Native nonpolar capacitors; generic 0.60 × 0.30 × 0.33 models/pads retained. |

## Verification of these changes

- `bun run typecheck` and the full `bun run build` pass, including native
  routing checks, required-port connectivity and all-layer Gerber shorts.
- Placement reports zero PCB errors/warnings. Existing schematic-layout
  advisories and supplier/metadata notices remain.
- Independent copper continuity: **215 connected pins / 48 nets, zero opens
  and zero shorted net groups**. The changed copper also passed Gerber shorts
  at 100 pixels/mm.
- All **231 physical pin/net/NC mappings** are identical to pre-review source
  `26945dd8bf85d4cdc27cff8aad63b1e986591e0b`; all 59 fitted MPN/code pairs match
  both that baseline and the 33-row BOM. Changed pad references are only
  L1, L2 and D1. No firmware or GPIO assignment changes.
- PCB/schematic snapshots were regenerated and snapshot comparison passes.
  D1's rendered bidirectional
  symbol and labels, L1/L2 native symbol metadata and the new PCB geometry
  were inspected. Executing the L1 JSCAD plan produces a 1.60 × 0.80 × 0.80 mm
  envelope in the CAD converter. L1/L2/D1 models all load through the converter
  and their lower surfaces sit on the 0.50 mm board-top plane.

Local logs, catalog URLs, downloaded drawings, OBJ bounds, generated passive
model bounds and the baseline comparison are under
`checks/package-audit-2026-09-07/` (ignored evidence directory).
No physical assembly or enclosure was tested. The remaining items above
prevent a claim that every footprint and CAD model is manufacturer-accurate.
