# R2 validation record — 2026-09-06

**Not fabrication released.** This record supersedes the historical R1 check
claims. A successful CLI exit is not sufficient: inspect the routed artifact
and run the separate Gerber copper-short check.

## Latest: native build and Gerber shorts pass

**`bun run build` exits 0, the routed artifact has zero error records, and
both default and 100-pixels/mm all-layer Gerber checks report no shorts.**

The starting routed layout had a BAT_NTC-to-GND copper short beside U2 and
two via-clearance errors at the redundant fixed VIO escape. Corrections:

- Move R4 to (-10.4, 4.4) mm, rotated 90 degrees, near U2's TS pin. Its
  final courtyard clears both C1 and C2.
- Remove `U2_VIO_ESCAPE`; keep VIO on VCORE and let the autorouter place its
  layer transition without a competing fixed via.
- Add `U4_SDA_ESCAPE` south of SDX at (4.750064, -9.85) mm to separate the
  sensor's SDA escape from the adjacent VDDIO fanout.
- Remove duplicate consecutive/closing polygon vertices from USB-C J1 pads
  13–16. Every nonzero edge and copper outline is unchanged. The repeated
  points had caused a native point-in-pad false positive for a via outside
  J1's ground pad; no pad was shrunk or moved to silence the check.

The final native netlist output is identical to the pre-change review output.
All 59 fitted components, values and electrical connections are retained.
No dependency patch, custom validation script, disabled DRC, relaxed rule,
autorouter configuration change or connector relocation was introduced.

Verification:

- `bun run typecheck`: pass.
- `bunx tsci check netlist index.circuit.tsx`: 0 errors, 0 warnings.
- `bunx tsci check schematic-placement index.circuit.tsx`: exit 0; existing
  trace-simplification suggestions remain.
- `bunx tsci snapshot index.circuit.tsx --update`: pass; snapshots updated.
- `bunx tsci check placement index.circuit.tsx`: 0 errors, 0 warnings.
- `bunx tsci check routing-difficulty index.circuit.tsx`: exit 0; advisory
  congestion remains (highest reported failure estimate 16.7%).
- `bun run build`: exit 0, including the default all-layer Gerber shorts check.
- `bunx tsci check shorts dist/index/circuit.json --pixels-per-mm 100`: exit 0,
  no shorts detected.
- `bunx tsci snapshot index.circuit.tsx --test`: exit 0, all snapshots match.

The final artifact contains **59 fitted components, 161 traces, 173 vias and
zero error records**. The PCB image and failing short-debug images were
inspected. Evidence and failed intermediate artifacts are retained under the
ignored `checks/build-short-fix/` directory; final logs use the `r3` suffix.

- Source SHA-256: `7cb4f1dc245b43a3e5b6abefe6a5b7f2b5e08a6e53abd9c73251c4fbfbe70951`
- USB-C import SHA-256: `125395caa73a9c7dba14c0a105b7ce739ba553e5823f9fbce8c4f02429aadd0b`
- Circuit JSON SHA-256: `6a5521a40a895f190dad8cfb05f53ee5bb26787ea2220b7808e7e7e2198aa993`

This is a local native-CLI pass, not a live-preview, hardware or fabrication
release. RF/clock layout, vendor-approved trace/drill rules, exact battery and
OLED selection, firmware and measured runtime remain outstanding.

## Previous: no-via-in-pad layout follow-up

**Historical intermediate layout; superseded by the verified build above.**

The user's removal of `isViaInPadAllowed` exposed 12 pre-existing in-pad vias.
The native baseline placement check reproduced all 12 errors. That removal,
and the removal of the explicit autorouter configuration/version, are preserved.
No placement-check bypass, dependency patch or relaxed clearance is introduced.

The 12 vias have moved outside the solderable pads: U2's outer-row escapes
extend beyond the package's pad field, /LP uses an interstitial dogbone, U1
reset/RF ground and U4 ground escape beyond their pad edges, and the five U1
ground stitching vias sit outside the QFN pad field. Via sizes and nets are
unchanged. The five external ground vias are **not equivalent to the former
direct EP thermal-via array**; ground-return/RF and thermal performance require
review before release. Existing fine-trace/drill manufacturing blockers remain.

The first route exposed a topology-merger failure: rounding the /LP dogbone
position to (-9.9, 2.4) mm slightly overlapped rectangular routing bounds.
Using the actual four-pad midpoint (-9.899925, 2.399923) mm resolved that input
conflict without changing pads, via diameter or clearance rules. A subsequent
full route had no via-in-pad violations but introduced an SCL-via/VCORE-trace
contact on inner1, confirmed by the native Gerber checker. The SCL escape
anchor moved east to x = -8.9 mm for the next reroute. Failing artifacts are
retained; successful build exits alone have not been counted as a pass.

Evidence is under the ignored `checks/no-via-in-pad/` directory.

## Previous: native CLI workflow without custom scripts

At the user's request, the deleted custom validation scripts are not restored.
`package.json` no longer calls `scripts/audit-circuit.mjs`; the `audit`, `test`
and `power-budget` aliases that referenced the missing directory are removed.
No dummy-success command or substitute custom checker has been introduced.

`bun run build` now chains the official netlist check, routed build, and
default all-layer Gerber shorts check with `&&`. The tscircuit skill's native
verification sequence is retained. This intentionally does not reproduce the
old project-specific BOM/electrical regression tests or power calculator;
the planning formula remains documented in `DESIGN_REVIEW.md`.

Fresh typecheck, netlist, schematic-placement and PCB placement exited 0.
The revised `bun run build` completed end to end with exit 0, including its
default all-layer Gerber shorts check: **no shorts detected**. Its routed JSON
contains 161 traces, 158 vias and **zero error records**. Existing supplier
footprint and metadata advisories remain; this is not a zero-warnings claim.
`scripts/` is absent and no package command references it. Evidence is under
the ignored `checks/native-cli-workflow/` directory.

- Source SHA-256 (unchanged): `05d9e59ba72d7ba6656cfde12264fae86704b4ef6b3724c4bfe50254268538cb`
- Circuit JSON SHA-256: `2921676b9b99d9712d10c6c444a42fcaae0653b6d0cdd195b003ffcd2fc70b0c`

No circuit source, footprint, connectivity, placement, routing rule,
dependency or lockfile changed.
The earlier cloud worker-timeout setting remains at 20 minutes. The separate
official `routing-difficulty` timeout is still unresolved and is not a pass.

## Previous: cloud worker-timeout follow-up

The supplied cloud log shows a worker timeout at **600000 ms**, not an
installation or TypeScript failure. The router was still advancing through
`exactGeometryDrcForceImproveSolver` when the worker was replaced. This is
distinct from the previously recorded `routing-difficulty` checker hang.

The official `build.workerTimeoutMs` option is now **1200000 ms (20 minutes)**
in `tscircuit.config.json`. The installed CLI schema accepts this setting and
the worker-build path passes it to the worker pool. An explicit
`TSCIRCUIT_BUILD_WORKER_TIMEOUT_MS` environment value has higher priority;
none is set in this local verification environment. The cloud environment
value and uploaded source hash were not supplied, so a cloud pass cannot be
inferred from a local result. References: [official schema](https://github.com/tscircuit/cli/blob/main/types/tscircuit.config.schema.json)
and [worker-pool implementation](https://github.com/tscircuit/cli/blob/main/cli/build/worker-pool.ts).

No PCB source, placement, net, footprint, routing effort, DRC limit or
dependency changed. This adjusts the worker's time budget, not the solver's
correctness or performance. The cloud command is `bunx tscircuit build --ci
--concurrency 4`, not the package build script containing
`--autorouter-timeout 15m`. One board still uses one worker; concurrency is
across files.

Fresh local typecheck, netlist, schematic-placement and PCB placement exited
0. A local run of the exact CI command also exited 0 and produced 161 traces,
158 vias and zero circuit error records, but an existing local cache was
present; its default all-layer Gerber shorts check also passed.

**Clean-copy CI verification passed.** Source, imports, config and lockfile
were copied into `/tmp/pedometer-cloud-ci.vJNTWb` without the original cache,
installed with `bun install --frozen-lockfile`, then netlist-checked before
running the exact `bunx tscircuit build --ci --concurrency 4` command. It
completed successfully in roughly six minutes locally; routing diagnostics
reached post-processing at 339 seconds. Its artifact contains 59 fitted
components, 161 traces, 158 vias and **zero error records**. Default and
100-pixels/mm all-layer Gerber shorts checks both exited 0 with **no shorts**.
The PCB and 3D images were inspected. Board, component, pad, plated-hole,
trace, via and copper-pour records match the warm CI artifact exactly.

The tscircuit skill's separate artifact/shorts verification was used because
the official CLI's CI mode alone is insufficient evidence of a clean board.
No ignore-DRC option or substitute checker was added. Frozen dependencies
installed successfully; both installed CLI copies retain the original Git
blob hash `675f42c276325d65349ca742458344d95c632300`.

- Source SHA-256 (unchanged): `05d9e59ba72d7ba6656cfde12264fae86704b4ef6b3724c4bfe50254268538cb`
- Config SHA-256: `9b30764fb78572ec97f7e68b7fedf0b615e9d8f858dd1c00ae49d6678697886a`
- Clean CI circuit JSON SHA-256: `54567af9fc0e4fba2f79fd32b190b5e8c8c4d1263714a03c0d63e859a1ce3f34`
- Workspace CI circuit JSON SHA-256: `1ae66f31d10d061c06f174d1f7815971830502754ff6ef5254b3b0e4d854167a`

Evidence and the preserved `clean-ci.circuit.json` are under the ignored
`checks/cloud-worker-timeout/` directory. Hosted verification is still pending;
no remote job was triggered and no changes were pushed. The separate
`routing-difficulty` hang and missing package validation scripts described
below remain unresolved; this does not claim all package commands pass.

## Previous: U2 preview-error follow-up

**Fresh local routed build: zero circuit error records; no shorts in both
default and 100-pixels/mm all-layer Gerber checks.** The live preview artifact
has not been independently verified; this is not an all-commands-pass or
fabrication-release claim. Earlier hashes below describe previous revisions.

The reported preview showed an LSLDO/VIO trace-to-via overlap and a /PG
trace too close to U2's /MR (C1) ball. Before changes, the saved routed build
had zero error records and the dev file-server's source SHA-256 matched the
local source exactly. Thus an outdated source file was not established as
the cause. The dev preview bundles a different core runtime (embedded version
0.0.1634, reporting 0.0.1635) from the installed project core 0.0.1654; this
is an observed runtime difference, not proof of the precise cause of the
reported route. No browser connection or exported live-preview JSON was
available, so that displayed artifact has not been independently verified.

U2's LSLDO escape is now at D4; VIO has a short horizontal escape immediately
east of E1; /PG escapes at B1. Subsequent full reroutes exposed actual U4
VCORE/GND, PMIC VDD/ground and MCU reset/VDDR contacts. They were checked with
the separate Gerber checker, not dismissed based on successful build exits.
U2 VDD now escapes at D1, U4 ground at pin 9, and MCU reset at pin 25.
A subsequent run exposed insufficient SCL-via clearance and a ground-via
contact at MCU VDDR2. The SCL via moved closer to E3 and MCU RFGND now has
direct local plane access at pin 40.
The new/adjusted vias use 0.2 mm copper / 0.1 mm drill; the existing four-layer
via-in-pad rules and filled/capped fabrication release requirements remain.
No fitted part, pin assignment, component placement or DRC limit changed.

Typecheck, netlist, schematic-placement, placement snapshot and PCB placement
all exited 0 on the final source. Netlist reports zero errors / zero warnings;
PCB placement reports no placement issues. The direct, official `bunx tsci
build index.circuit.tsx --all-images --pcb-png --schematic-png
--autorouter-debug --autorouter-debug-dir checks/u2-preview-clearance/autorouter-r4
--autorouter-dump-srj all --autorouter-timeout 15m` exited 0 and reported one
passed circuit. Its routed JSON contains 59 fitted components, 161 traces,
158 vias and zero error records. Both `bunx tsci check shorts
dist/index/circuit.json` and the additional `--pixels-per-mm 100` run exited 0
and reported no shorts. The final PCB image and routed-phase image were
visually inspected. The tscircuit skill's separate shorts checks guided the
local escape corrections rather than relying on build exit status alone.

The unmodified routing-difficulty command again produced no report within
45 seconds and was stopped by the diagnostic timeout (`ETIMEDOUT`, supervisor
exit 124): **NOT PASSED**. Missing package validation scripts described below
remain unresolved; direct CLI build success does not mean `bun run build`,
`audit`, `test` or `power-budget` have passed.

- Source SHA-256: `05d9e59ba72d7ba6656cfde12264fae86704b4ef6b3724c4bfe50254268538cb`
- Circuit JSON SHA-256: `58a9d1d2ada724f577fc67d81decbfa1c9d040a343ba411285ee996bc4a4390b`
- BOM SHA-256 (unchanged): `353113b9b7550757aefdc2cef108f5d0868130ce6b660a1370527ede8bfe6758`

After the final build, the dev file-server returned HTTP 200 and its source
hash matched the final source above. This verifies the served source, not
the rendered preview's routing. If the preview still shows errors after a
refresh, export its Circuit JSON for comparison with the verified local build.

Evidence and intermediate failing routes are in the ignored
`checks/u2-preview-clearance/` directory. Dependencies remain official and
unmodified; no checker was replaced or suppressed.

## Previous: J1 mounting-slot edge clearance

J1 moved 1 mm inward, from x = -20.6 to -19.6 mm. The complete imported
USB-C footprint moved together; its mounting-slot dimensions, pin spacing,
rotation and part selection are unchanged. Relative to the left board edge
at x = -24.1 mm, the nearest slot drill edge is now **1.026 mm inside** and
its copper edge is **0.826 mm inside**. These measurements account for the
footprint's 270-degree rotation, not just the component bounding box.
The connector mouth still overhangs the edge for cable access; the existing
`allowOffBoard` setting was not added or changed to obtain a passing result.

To clear J1's assembly courtyard, D1 moved from (-16.2, -1.5) to
(-15.5, -2.8) mm and FB1 moved from (-15.5, 2) to (-14.7, 2) mm.
No other fitted component placement, electrical connection, board dimension,
footprint or routing rule changed.

The first full reroute introduced a VCORE / PMIC_LP contact near U2, confirmed
by a circuit trace-error record and the all-layer Gerber shorts check at
approximately (-9.099, 2.685) mm. The router itself reported zero errors,
so its status alone was insufficient. A local `U2_LP_ESCAPE` via now anchors
the /LP layer change at U2's D3 ball, using the existing 0.2 mm outer / 0.1 mm
drill dimensions and already-enabled via-in-pad policy. The required filled
via-in-pad manufacturing review remains a release gate; no rule was relaxed.

Fresh typecheck, netlist, schematic-placement, placement snapshot and PCB
placement checks exited 0. Netlist reports 0 errors / 0 warnings; PCB
placement reports no placement issues, and the placement artifact contains
zero circuit error records. Existing schematic trace-simplification
suggestions and supplier/native-footprint advisories remain.

The official, unmodified routing-difficulty command again timed out after
45 seconds (`ETIMEDOUT`, supervisor exit 124): **NOT PASSED**. Evidence for
this change, including rotated slot-edge measurements, is under the ignored
`checks/j1-edge-clearance/` directory. The older routed-artifact hashes below
refer to earlier placements, not this change.

The final direct, unmodified `bunx tsci build index.circuit.tsx --all-images
--pcb-png --schematic-png --autorouter-timeout 15m` completed successfully.
The routed artifact contains 59 fitted components, 161 traces, 168 vias and
**zero circuit error records**. Both the default all-layer Gerber shorts
check and the additional 100-pixels/mm check report **no shorts**. The final
PCB image was inspected and the slot clearances were remeasured on that
routed artifact. The tscircuit skill's separate shorts check caught the first
reroute's contact and prompted the local /LP escape correction above.

- Source SHA-256: `a99f73e9c4564c9488fe54253452800fe5841a54c063075a18916f0fd91e8546`
- Circuit JSON SHA-256: `952416286cf056eefa942ddc214376d635bf1549b91858583437bcc006118021`
- BOM SHA-256 (unchanged): `353113b9b7550757aefdc2cef108f5d0868130ce6b660a1370527ede8bfe6758`

A concurrent edit to J1's imported 3D-model origin was preserved; the physical
footprint geometry was not changed. The checks above validate PCB geometry,
not mechanical alignment of that separate CAD-model edit. Package-script
limitations described below remain; this is not an all-commands-pass claim.

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

During this verification, concurrent workspace changes removed the original
`scripts/` directory. The official `tsci build` completed
successfully, but `bun run build` then exited 1 because its subsequent
`scripts/audit-circuit.mjs` no longer existed. At that point the `audit`, `test`
and `power-budget` package scripts also referenced that removed directory;
their previous passes did not describe that workspace. The deletions were
preserved while awaiting the user's workflow choice.
This failure was subsequently resolved by the user's choice of a native-only
workflow; see the latest section above. See `checks/unpatched-validation/build.log`
for the historical failure.
The official CLI dev server was restarted and its page returned HTTP 200.

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
  the original 13 board/power-budget tests were separate from this patch.
  See the current status above for the subsequent removal of `scripts/`.
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
