# Fabrication and Validation Notes

R4 has complete explicit routing in `routing.tsx`, with zero native routing
errors, no disconnected nets in the geometric audit and no Gerber shorts at
100 pixels/mm. These results do not select or approve a fabrication process.
The source disables automatic rerouting to preserve the complete copper;
the build still independently runs the native routing checks.

## PCB class

- 46.6 mm x 32 mm, 1.0 mm FR-4, four copper layers.
- Recommended stack: L1 components/signals, L2 ground pour with only necessary
  signal escape cuts, L3 low-speed/power, L4 signals/ground fill. The design
  includes the L2 GND pour; minimize remaining L2 signal length during final
  fabrication-CAD review to make the return plane as continuous as practical.
- 0.075 mm (3 mil) nominal fine-pitch routes in the BGA escape regions.
- The source sets a 0.05 mm trace-to-pad minimum and 0.10 mm pad-to-pad and
  via-to-pad minima; inspect actual trace-to-trace
  clearances in the final routed output and confirm that the selected process
  explicitly supports all fine-pitch rules.
- All 138 escape/stitching/routing vias use 0.20 mm drill / 0.45 mm outer copper
  diameter; the autorouter minima match. Their nominal annular ring is
  0.125 mm. These vias span all four layers, NOT blind laser microvias.
  This matches the alternative dimensions in the user-provided JLCPCB email,
  not a blanket approval of this board's fabrication or assembly process.
  This layout is not released for a standard JLCPCB 4-layer
  process. Agree the escape strategy, drill sizes/layer pairs and annular rings
  before rerouting/exporting for manufacture. Any future approved via-in-pad
  revision also requires a filled/capped process review.
  See [JLCPCB capabilities](https://jlcpcb.com/capabilities/pcb-capabilities/).
- Do not substitute ordinary open through-vias in BGA pads; solder wicking can
  create opens and package collapse problems.
- The current manual escapes avoid solderable pads. U1's five ground vias
  sit outside the QFN pad field; four have explicit top-copper connections
  to the exposed pad. They are not a via-in-pad thermal array. Review the
  exposed-pad connection, RF return inductance and thermal
  path before release. Inspect autorouted vias too, not only the manual ones.
- U2 now has 18 manual escapes to vias outside its ball array. Preserve these
  clear paths when editing the completed routing; candidate-via placement alone
  did not prevent the native router from creating local contacts.
- Request controlled 50 ohm geometry for the RF feed based on the fabricator's
  actual stackup. Recalculate the feed width instead of treating the generic
  tscircuit trace width as an impedance solution.

## RF layout

The C20-L2-C21 network uses TI's CC2340R5 source filter values. U1 now faces
the antenna, and the filter/feed have explicit top-layer routes with local
ground connections. Both crystal signal networks remain on top. This custom
geometry still needs impedance/tuning review against the selected stackup.
R13 is a zero-ohm tuning placeholder between the filter and ceramic antenna.
The antenna keepout excludes L2/L3/L4 copper and unrelated top routing; the
L2 pour outline also has an explicit edge-open notch.

For production:

- move/resize the keepout to the antenna vendor's final ground-plane geometry;
- keep the enclosure, battery, display cable, mounting hardware, and user's
  body out of the near-field region as far as practical;
- add optional series/shunt tuning footprints if the first article cannot be
  corrected with the existing location;
- tune with a VNA in the final mechanical assembly;
- verify radiated output, harmonics, coexistence, and regulatory limits.

## Battery and charging

- Use a protected single-cell rechargeable pack only.
- Verify J2 polarity and NTC wiring on every incoming battery lot.
- R3 limits the fast-charge register code. Its ~51 mA nominal ceiling assumes
  ICHARGE_RANGE=0; range=1 doubles it. Program USB input current separately.
- R5 now pulls /CE high while VCORE is present; DIO1 may enable charge only
  after configuration/readback. Scope startup/brownout; this is not a fully
  independent charging safety interlock.
- R4 is the fixed 10 kOhm leg of the BQ25150 temperature-sense network. The
  battery pack is expected to provide a 10 kOhm NTC with a compatible curve
  (TI's default reference is beta 3380 K). R4 intentionally remains parallel
  to the pack NTC; do not remove it as if it were a redundant pull-down.
- The product must not charge until the correct cell regulation voltage,
  current, temperature window, timers, and termination behavior are confirmed.
- Test open/shorted NTC, reversed connector, missing cell protection, USB
  hot-plug, deeply discharged cell, and charge while the product is active.

## Assembly review

1. Confirm footprints against manufacturer drawings at 1:1, especially the raw
   imports for U1 CC2340R53N0RKPR, U2 BQ25150YFPR, U3 BQ27427YZFR, and U4
   BMA400. Also confirm the native 0201 RF land pattern against the selected
   LCSC parts. Supplier CAD is not a release authority.
2. Confirm U3 and U4 package orientation—their data sheets show both top and
   bottom views and are easy to mirror accidentally.
3. Confirm USB-C J1 shell tabs and insertion direction against the exact
   C165948 receptacle.
4. Confirm J2/J3/J4/J5 mating height, cable exit, enclosure openings, and button
   actuator access.
5. Require X-ray inspection of U2/U3 on first articles.
6. Confirm the locked crystals preserve frequency, ESR, drive level, and load
   capacitance: Y1 is C1985532 (48 MHz, 7 pF) and Y2 is C179635 (32.768 kHz,
   9 pF).
7. Every fitted passive is locked to the LCSC code in `BOM.csv`; verify its
   dielectric, tolerance, voltage rating, DC-bias behavior, package, and RF Q
   before purchase rather than accepting an automatic substitute.
8. Review the availability-driven changes in `JLCPCB_PARTS.md`, particularly
   D1, L1, AE1, and Y1. The antenna change requires a new reference-layout and
   VNA review rather than only a footprint comparison.

## Bring-up service connector

J5 is JST-SH C160390. Use a keyed, current-limited service harness and never
short adjacent power domains.

| J5 pin | Net | Expected use |
| --- | --- | --- |
| 1 | CHARGER_IN | protected USB input after ferrite bead |
| 2 | BAT_PACK_POS | cell-side positive, before gauge shunt |
| 3 | VCORE | 1.8 V at reset, then firmware-configured 3.0 V |
| 4 | GND | measurement return |

J5 pin 2 is for high-impedance measurement, not powering an accessory: an
external load here bypasses the gauge shunt. Never tie J5's separate rails
together. J4 pin 1 is SWD target reference; do not inject a debugger supply.

## Pre-order checklist

- [x] tscircuit type-check passes.
- [ ] All 59 fitted source components still report the intended JLCPCB code;
      live stock and assembly tier have been rechecked.
- [ ] Connectivity and placement have been reviewed against every data sheet.
- [ ] PCB trace, via, pad, edge, and keepout DRC are zero in the fabrication
      CAD tool using the selected vendor's rules.
- [ ] Gerber/ODB++, drill, solder paste, and IPC-356/netlist outputs agree.
- [ ] BGA solder paste apertures and escape-via process are approved by the
      assembler; any deliberately reintroduced via-in-pad is filled/capped.
- [ ] U1 exposed-pad ground return and thermal path are approved for the
      external-ground-via layout.
- [ ] Cell data sheet and written charger register configuration are approved.
- [ ] RF stackup calculation and antenna tune plan are approved.
- [ ] A five-board engineering build precedes any wearable/user trial.
- [ ] Thermal, ESD, drop, sweat/condensation, charge-fault, and runtime tests
      have defined pass/fail limits.
