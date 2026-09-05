# R2 validation record — 2026-09-05

**Not fabrication released.** This record supersedes the historical R1 check
claims. A successful CLI exit is not sufficient: inspect the routed artifact
and run the separate Gerber copper-short check.

Reviewed `index.circuit.tsx` SHA-256:
`bb631631a9eb3799390ca006ece4c8aa85c2d05eed2451c226ad54f63a80cae7`.
Dependencies: tscircuit 0.0.2297, CLI 0.1.2021, capacity-autorouter 0.0.790,
as installed from `bun.lock`.

## Current checks

| Check | Result | Evidence |
| --- | --- | --- |
| TypeScript | PASS | `checks/review-r2/typecheck.log` |
| Netlist | PASS, 0 errors / 0 warnings | `checks/review-r2/netlist.log` |
| Schematic placement | PASS, trace-simplification suggestions remain | `checks/review-r2/schematic-placement.log` |
| Placement-only build / snapshot | PASS | `checks/review-r2/placement-build.log`; `dist/index/__snapshots__/` |
| PCB placement | PASS, 0 errors / 0 warnings | `checks/review-r2/placement.log` |
| Routing difficulty | NOT COMPLETED in CLI; source and JSON attempts stopped | See diagnostic below |
| Full routed build | PASS; routing completed in 508.2 seconds | `checks/review-r2/build.log` |
| Routed electrical/BOM audit | PASS, no issues | `checks/review-r2/audit.log` |
| Gerber copper shorts, all layers | PASS at default resolution and 100 pixels/mm | `checks/review-r2/shorts.log`, `shorts-100ppm.log` |
| Battery-budget unit tests | PASS, 3 tests | `checks/review-r2/power-budget-tests.log` |
| Fault-injection regression tests | PASS, 8 tests; does not certify the current routing | `checks/review-r2/negative-tests.log` |
| Full test suite | PASS, 12 tests including current routed-board baseline | `checks/review-r2/tests.log` |

The final artifact contains 59 fitted components, 161 routed traces, 155 vias,
one GND-pour record, and zero circuit error records. All 59 BOM entries match
their source MPN/JLCPCB codes. Nominal on-board LDO capacitance is 3.8 uF
including the switched OLED bypass, excluding the unspecified external module.
The initial five-minute routing attempt timed out; the fifteen-minute retry
completed. Neither DRC rules nor error reporting were relaxed to obtain a pass.

Netlist and schematic checks ran before the placement build. The placement
snapshot was generated from the resulting unrouted JSON before routing checks:

```sh
bun run typecheck
bunx tsci check netlist index.circuit.tsx
bunx tsci check schematic-placement index.circuit.tsx
bunx tsci build index.circuit.tsx --routing-disabled --pcb-png
bunx tsci snapshot dist/index/circuit.json --update
bunx tsci check placement index.circuit.tsx
bunx tsci check routing-difficulty index.circuit.tsx
bunx tsci check netlist index.circuit.tsx
bunx tsci build index.circuit.tsx --all-images --autorouter-timeout 15m
bun run audit
bunx tsci check shorts dist/index/circuit.json
bunx tsci check shorts dist/index/circuit.json --pixels-per-mm 100
bun run test
```

The last four commands ran on the successfully routed current artifact. An
unrouted placement JSON must not be presented as a passing routed PCB. The
JSON-input snapshots were refreshed again after routing; see
`checks/review-r2/routed-snapshot.log`. Current render outputs are
`dist/index/pcb.svg`, `dist/index/schematic.svg`, and `dist/index/3d.png`.
This CLI's `--all-images` refreshed the SVGs and 3D PNG, not the two older
2D PNGs. Those were preserved as `checks/review-r2/placement-pcb.png` and
`previous-schematic.png` to prevent confusing old views with final routing.
Source, circuit JSON and BOM fingerprints are in `checks/review-r2/sha256.txt`.

### Congestion diagnostic

The source-input CLI ran for approximately 11 minutes without output; the
prebuilt placement-JSON variant ran for approximately 2.5 minutes without
output. Both were explicitly stopped, not passed. The empty logs are
`routing-difficulty.log` and `routing-difficulty-json.log` in the review folder.

A bounded diagnostic using the installed package's
`AutoroutingPipelineSolver4_TinyHypergraph`, the same placement JSON and
`effort: 1` reached `highDensityRouteSolver` after 23.9 seconds with
`failed: false`. See `checks/review-r2/congestion-diagnostic.log`. This does not
replace a completed CLI congestion report. The CLI's bundled `solveUntilPhase`
loop lacks a failed/solved exit guard, a possible reason for a stalled check;
the exact state of the stopped CLI processes was not established.

## Warnings and limitations

- Native tscircuit passive footprints are intentionally retained. Their land
  patterns differ from the supplier-import patterns, so footprint-comparison
  warnings remain. They have not been suppressed or declared equivalent.
- All 59 fitted components retain JLCPCB part codes. Generic native CAD and
  raw-import OBJ/STEP metadata are different forms of model support; neither
  establishes dimensional correctness. Inspect physical models and pin 1.
- Raw wrappers can produce semantic/refdes and missing pin-metadata
  advisories; the explicit electrical-net contracts are audited separately.
- Earlier R2 Gerber checks found real shorts near U1 SDA and U2 /LP. Escape
  vias were added to address them. The final current routed artifact passes
  both Gerber short checks; rerun them after any routing or placement change.
- See `DESIGN_REVIEW.md` and `FABRICATION_NOTES.md`: the RF/crystal layout and
  existing fine trace/clearance/full-stack-via rules are release blockers.
  Clean software checks do not approve those rules for JLCPCB manufacture.
- Battery and OLED specifications, firmware implementation, charge-fault,
  RF, ESD, step accuracy and measured battery-life validation remain open.
