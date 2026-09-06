# Engineering review — R4 routed layout, 2026-09-06

Status: improved prototype, **not fabrication released**. Automated checks and
physical readiness are separate. See VALIDATION.md for the current check run.

## R4 layout and routing

The charger moves to (-6, 8) mm, the MCU/RF cluster moves upward by 2 mm,
and the accelerometer moves into the central area. Edge connectors and the
antenna exclusion remain accessible. J2/J3/J4 now declare their actual vertical
mating direction without changing any imported pad or body geometry.

The full copper is explicitly authored in `routing.tsx`: 303 layer paths,
138 unique 0.20/0.45 mm through-vias, and all 46 nets physically continuous.
The native build, independent routing DRC, required-port check, placement and
100 pixels/mm all-layer Gerber shorts check pass. Automatic rerouting is off;
the installed solver still has unresolved defects. Source-to-net connectivity
and the 59-part BOM are preserved. See [VALIDATION.md](VALIDATION.md).

These checks close the open routing task. The RF, decoupling/DC-DC return,
fabrication-process and assembled-hardware reviews below still apply.

## R3 electrical changes retained

R3 adds explicit top-layer charger fanout outside the ball array,
retains 0.20/0.45 mm through-vias, turns the MCU/crystal group toward the
antenna, and supplies explicit RF and exposed-pad ground paths. C5 increases
from 1 to 4.7 uF to meet TI's VINLS bypass sizing guidance. R6/R7 become
100 kOhm to reduce asserted status-line current; their rise time and leakage
margin need measurement. BOM references are synchronized with these changes.

Trace-to-pad clearance increases to 0.05 mm, while pad-to-pad and via-to-pad
clearances increase to 0.10 mm. These remain fine-geometry rules requiring
process review. The build now checks error records and calls the bundled
native PCB-port connectivity check: the installed CLI can return exit 0 after
an autorouter failure. No dependency code or
error records were patched. Validation history below must not be substituted
for the latest source's results in [VALIDATION.md](VALIDATION.md).

## Earlier R2 corrections

- U1 pin 1 (VDDR2) was disconnected. Both VDDR pins now share the internal
  supply network; C16 becomes a local 100 nF VDDR bypass. C10–C15 were moved
  toward their corresponding supply pins. This follows the
  [TI clarification that the VDDR pins must connect externally](https://e2e.ti.com/support/wireless-connectivity/bluetooth-group/bluetooth/f/bluetooth-forum/1550946/cc2340r5-do-vddr-pins-connected-internally).
- R5 changes from /CE pull-down to pull-up; spare DIO1 controls charge enable.
  Inhibit charging until cell-specific configuration has been checked. This
  only biases charging off while VCORE is present, not during every possible
  power fault. Startup and brownout tests remain mandatory.
- C5 increases to 1 uF at VINLS; C6 becomes 2.2 uF. Moving C16 off VCORE removes
  the old extra 10 uF load. Nominal direct VCORE bypass falls from 15.3 to
  2.8 uF (3.8 uF including switched C25). External OLED capacitance, tolerance
  and DC bias still need review against
  [TI's recommended capacitor range](https://www.ti.com/lit/ds/symlink/bq25150.pdf).
- Corrected IMAX documentation: it limits charge-current code, not USB input
  current. The previous ~51 mA claim only applies with ICHARGE_RANGE=0;
  changing the range doubles the ceiling. This is not a guaranteed cell-safe
  limit including tolerances.
- Corrected BMA400 normal-mode step counting, /LP polarity and wake delay,
  battery-absent gauge handling, SWD voltage reference, and ship-mode policy.
  [Bosch documents advanced interrupts as normal-mode functions](https://www.bosch-sensortec.com/media/boschsensortec/downloads/datasheets/bst-bma400-ds000.pdf).
- Added circuit/BOM regression audit and a tested battery-runtime calculator.
  Part IDs remain locked; no new supplier codes or loose test points added.
- Gerber checking caught an SDA escape touching adjacent U1 pin 21. Added a
  dedicated SDA escape via near pin 22; retain it and rerun the copper check
  whenever the MCU region changes.
- The concurrently supplied manual charger link triggered an autorouter
  topology overlap. Preserved its electrical intent using explicit VCORE
  connections and nearby LDO/VIO escape vias instead. Native footprints remain.

## Release blockers / remaining engineering

| Priority | Finding | Required closure |
| --- | --- | --- |
| High | The source uses 0.20 mm drills / 0.45 mm via copper, 0.075 mm minimum traces, 0.05 mm trace-to-pad and 0.10 mm pad/via-to-pad clearances. These are not a complete normal JLCPCB rule set. | Select an approved process/stackup and close every actual exported clearance against it. Do not reduce clearance just to get a green check. |
| High | Standard-size through-vias require BGA escape outside the ball field; larger drill settings alone are not DFM approval. | Verify final drill files, layer spans, annular rings and BGA escape geometry with the fabricator. Do not infer Economic PCBA eligibility from via dimensions. |
| High | U1 now faces its RF filter, and RF/crystal signals have explicit top routes. The generic feed width is still not a calculated impedance. | Confirm continuous RF ground, calculate feed impedance from the approved stackup, review decoupling/DC-DC return geometry, verify crystal startup/frequency and tune the antenna in the enclosure. |
| High | Exact battery and OLED module remain unspecified. | Approve pack voltage/current/NTC, protection and cable polarity; verify OLED 3 V compatibility, current, input capacitance and ramp behavior. |
| Medium | USB TVS alone does not establish system ESD immunity; exposed CC, SWD and cable pins require review. | Check clamp voltage at relevant current and return inductance; add suitable low-capacitance protection where testing requires it. |
| Medium | J5 BAT is before the gauge shunt; powered accessories there bypass measurement. J4 voltage pin can backfeed the regulator. | Use J5 BAT for high-impedance measurement only; use J4 as target reference, not a supply input. |
| Medium | Supplier CAD availability is not proof of correct physical placement. | Inspect all 3D bodies, pin-1 orientations, connector mates, package drawings and assembly tolerances. |

These DFM concerns are based on the source settings and exported via records,
compared with [JLCPCB's published capabilities](https://jlcpcb.com/capabilities/pcb-capabilities/).
The existing fine rules were not loosened in this review. A clean short check
means no detected copper short, not that these rules are manufacturable.

## Battery-life planning

No custom script is required for this planning calculation. The example uses
80% usable capacity, 50 uA total battery-side
tracking average (including radio/gauge) and an extra 12 mA while displaying.
These are explicit assumptions, not measured performance.

For capacity in mAh and daily display time in seconds:

```text
average_mA = tracking_uA / 1000 + display_extra_mA * display_seconds_per_day / 86400
runtime_days = capacity_mAh * usable_fraction / average_mA / 24
```

For 100 mAh: 1 minute of display/day gives about 8.2 weeks; 5 minutes gives
5.2 weeks; 10 minutes gives 3.6 weeks. Replace both current assumptions with
full-cycle measurements and include aging, temperature, leakage and reserve.
Sensor “low-power” headline current is not the step-counting system current.

## First-article acceptance

Before a wearable trial: zero vendor-rule DRC errors; approved antenna/clock
layout; verified cold/room/hot charge limits and NTC faults; clean startup and
OLED load steps; step-count validation in the intended worn position; measured
BLE current/range; measured battery-terminal energy over representative days.
