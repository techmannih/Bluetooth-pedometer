# R2 validation record — 2026-09-05

**Not fabrication released.** This record supersedes the historical R1 check
claims. A successful CLI exit is not sufficient: inspect the routed artifact
and run the separate Gerber copper-short check.

## Current policy: official, unmodified dependencies

The experimental dependency patch has been withdrawn at the user's request.
`patchedDependencies` is absent from both `package.json` and `bun.lock`, the
patch files and their seven patch-only tests are absent, and `bun install`
restored the official CLI 0.1.2021. Its installed `dist/cli/main.js` Git blob
hash matches the original unmodified package:
`675f42c276325d65349ca742458344d95c632300`.

Do not patch dependencies, modify installed package code, monkey-patch the
runtime, or substitute a custom checker to obtain a passing CLI result.
The upstream `routing-difficulty` issue remains unresolved. The historical
patched run below is **not** an all-pass result for the official CLI.
Fresh unpatched verification evidence is under `checks/unpatched-validation/`.

The unmodified CLI's routing-difficulty check was retried after the netlist,
schematic-placement, fresh placement snapshot and PCB-placement checks passed.
It produced no report within 45 seconds and was stopped by the diagnostic
timeout (`routing-status.json`: `ETIMEDOUT`, supervisor exit 124). This is
**NOT PASSED**; no alternate checker or modified dependency was used.

## Historical: experimental patched-CLI validation (withdrawn)

With the now-withdrawn patch, all twelve finite commands below completed with
exit code 0 in the documented order on 2026-09-05. `bun run dev` then started successfully; the page and
`/api/files/list` both returned HTTP 200. This verifies server startup/API
availability, not every interactive browser action. Evidence is in the ignored
`checks/command-validation/` directory.

| Command | Result | Log |
| --- | --- | --- |
| `bun install` | PASS | `install.log` |
| `bun run typecheck` | PASS | `typecheck.log` |
| `bunx tsci check netlist index.circuit.tsx` | PASS; 0 errors / 0 warnings | `netlist.log` |
| `bunx tsci check schematic-placement index.circuit.tsx` | PASS; trace-simplification suggestions remain | `schematic-placement.log` |
| `bun run snapshot:update` | PASS; fresh placement-only build and snapshots | `snapshot-update.log` |
| `bunx tsci check placement index.circuit.tsx` | PASS; 0 errors / 0 warnings | `placement.log` |
| `bunx tsci check routing-difficulty index.circuit.tsx` | PASS; completed congestion report, not zero congestion | `routing-difficulty.log` |
| `bun run build` | PASS; routed output and automatic audit | `build.log` |
| `bun run audit` | PASS; zero issues | `audit.log` |
| `bunx tsci check shorts dist/index/circuit.json` | PASS; no shorts | `shorts.log` |
| `bun run test` | PASS; 20 tests, 0 failures/skips | `tests.log` |
| `bun run power-budget` | PASS; planning estimates only | `power-budget.log` |
| `bun run dev` | PASS; server startup and HTTP smoke checks | `dev.log` |

The circuit source and BOM are unchanged. Current routed output contains 59
fitted components, 161 traces, 178 vias and zero circuit error records.
The additional all-layer Gerber check at 100 pixels/mm also reports no shorts
(`shorts-100ppm.log`).

- Source SHA-256: `106abff49539288a1c28cf64d0564569a7f902c47694072a87b66b1a4dbd3c66`
- Circuit JSON SHA-256: `3bc0f670adaa15e8b82e76f5dd4c29cd758115963edd55d39d1fb4f8b065673c`
- BOM SHA-256: `353113b9b7550757aefdc2cef108f5d0868130ce6b660a1370527ede8bfe6758`

### Historical workflow changes and remaining advisories

- An experimental Bun patch addressed the CLI congestion hang in this historical
  run only. It has since been removed. Analysis used the project's converter and routing engine, preserving
  board clearances, via sizes and keepouts. Failed/incomplete solvers throw;
  source checks did not reuse cached artifacts from a different render mode.
- A fresh temporary `bun install --frozen-lockfile` applied the patch and passed
  all seven CLI regression tests. Those patch-only tests have since been removed;
  the original 13 board/power-budget tests are retained.
- Snapshot updates deliberately prepare placement-only output before routing;
  the subsequent full build replaces it with routed output. Only the main
  board is discovered, and generated checks/builds/logs are excluded from the
  dev watcher. Full builds refresh PCB/schematic PNGs as well as SVG/3D views.
- An intermediate run logged transient model-CDN `ECONNRESET` errors. Its log
  is retained as `routing-with-cdn-errors.log`; the final full workflow rerun
  completed without those errors. Future online model fetches still depend
  on external service availability.
- The congestion report contains estimates up to 10.8%; this is an advisory
  routing-risk analysis, not a copper-short check or manufacturing approval.
  Existing native/supplier footprint differences, automatic unnamed-trace and
  imported-symbol metadata advisories remain visible. No error checks were
  disabled, and no PCB rules were relaxed.
- The RF, manufacturing-stackup and battery/firmware release gates below and
  in `DESIGN_REVIEW.md` / `FABRICATION_NOTES.md` still apply. Passing commands
  does not make this board fabrication-released or guarantee battery runtime.

## Previous: J2 / SW1 spacing follow-up

J2 and its BAT legend moved 4 mm left, from x = -14 to -18 mm. SW1 stays at
its original location. The horizontal pad-bound gap increases from 0.075 to
4.075 mm; the imported 3D model bounds now have approximately 3.2 mm horizontal
separation. No fitted part, pin connection or other component placement changed.

The first reroute introduced an SCL/PMIC_INT contact near U2 on inner2,
confirmed by both circuit-error records and the 100-pixels/mm Gerber check.
An explicit `U2_SCL_ESCAPE` via now anchors the SCL layer change away from the
interrupt escape. Routing rules and reporting remain unchanged.

Current source SHA-256:
`106abff49539288a1c28cf64d0564569a7f902c47694072a87b66b1a4dbd3c66`.
Evidence for this follow-up is under `checks/j2-sw1-spacing/`.

| Check | Current follow-up result |
| --- | --- |
| TypeScript / netlist | PASS; netlist has 0 errors and 0 warnings |
| Schematic placement / placement snapshot | PASS; existing simplification suggestions remain |
| PCB placement | PASS; 0 errors and 0 warnings |
| Fitted-part/net/placement comparison | PASS; only J2 moves, plus the routing via |
| Congestion CLI | Both attempts timed out after 90 seconds; NOT passed |
| Full routed build / audit | PASS; corrected routing completed in 211.2 seconds, no error records or audit issues |
| Gerber shorts | PASS on all layers at default resolution and 100 pixels/mm |
| Full regression suite | PASS, 13 tests including the new 4 mm spacing guard |

The corrected artifact contains 59 fitted components, 161 routed traces and
178 vias. `build.log`, `audit.log`, `tests.log`, `shorts.log` and
`shorts-100ppm.log` in the follow-up evidence directory record these results.
`change-audit.log` compares the unchanged fitted parts, named pin connections
and other component placements; `model-bounds.log` records the imported-model
dimensions used for the spacing check. The earlier failed route is preserved
as `attempt1.circuit.json` with its build/short logs, not used as final output.

Current views: `dist/index/pcb.svg`, `dist/index/schematic.svg` and
`dist/index/3d.png`. Routed snapshots were refreshed. The placement-only PNG
is archived as `checks/j2-sw1-spacing/placement-pcb.png`. Current source,
circuit JSON and BOM fingerprints are recorded in that folder's `sha256.txt`.

The earlier baseline below does not certify the changed follow-up routing.

## Earlier R2 validation baseline

Reviewed `index.circuit.tsx` SHA-256:
`bb631631a9eb3799390ca006ece4c8aa85c2d05eed2451c226ad54f63a80cae7`.
Dependencies: tscircuit 0.0.2297, CLI 0.1.2021, capacity-autorouter 0.0.790,
as installed from `bun.lock`.

### Earlier baseline checks

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
