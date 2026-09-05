# R2 engineering review — 2026-09-05

Status: improved prototype, **not fabrication released**. Automated checks and
physical readiness are separate. See VALIDATION.md for the current check run.

## Corrections implemented

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
| High | Existing 0.075 mm traces, 0.04–0.05 mm clearance and 0.1 mm drills are not a normal JLCPCB 4-layer rule set. | Select an approved process/stackup and reroute under its actual rules. Do not reduce clearance just to get a green check. |
| High | Full-stack 0.1 mm escape vias do not constitute an approved HDI process. | Verify via layer pairs, drill files, lamination, aspect ratio and filled/capped via-in-pad with the manufacturer. |
| High | U1's ANT/X48 pins face away from the present antenna/crystal cluster. Generic autorouting does not implement RF impedance or a suitable crystal loop. | Reorient/re-place the RF/clock cluster, constrain critical routes to the top layer over continuous ground, and set feed width using the approved stackup. Retune the exact antenna in the enclosure. |
| High | Exact battery and OLED module remain unspecified. | Approve pack voltage/current/NTC, protection and cable polarity; verify OLED 3 V compatibility, current, input capacitance and ramp behavior. |
| Medium | USB TVS alone does not establish system ESD immunity; exposed CC, SWD and cable pins require review. | Check clamp voltage at relevant current and return inductance; add suitable low-capacitance protection where testing requires it. |
| Medium | J5 BAT is before the gauge shunt; powered accessories there bypass measurement. J4 voltage pin can backfeed the regulator. | Use J5 BAT for high-impedance measurement only; use J4 as target reference, not a supply input. |
| Medium | Supplier CAD availability is not proof of correct physical placement. | Inspect all 3D bodies, pin-1 orientations, connector mates, package drawings and assembly tolerances. |

These DFM concerns are based on the source settings and exported via records,
compared with [JLCPCB's published capabilities](https://jlcpcb.com/capabilities/pcb-capabilities/).
The existing fine rules were not loosened in this review. A clean short check
means no detected copper short, not that these rules are manufacturable.

## Battery-life planning

Run `bun run power-budget` or `bun run power-budget 150` for a different mAh
capacity. The example uses 80% usable capacity, 50 uA total battery-side
tracking average (including radio/gauge) and an extra 12 mA while displaying.
These are explicit assumptions, not measured performance.

For 100 mAh: 1 minute of display/day gives about 8.2 weeks; 5 minutes gives
5.2 weeks; 10 minutes gives 3.6 weeks. Replace both current assumptions with
full-cycle measurements and include aging, temperature, leakage and reserve.
Sensor “low-power” headline current is not the step-counting system current.

## First-article acceptance

Before a wearable trial: zero vendor-rule DRC errors; approved antenna/clock
layout; verified cold/room/hot charge limits and NTC faults; clean startup and
OLED load steps; step-count validation in the intended worn position; measured
BLE current/range; measured battery-terminal energy over representative days.
