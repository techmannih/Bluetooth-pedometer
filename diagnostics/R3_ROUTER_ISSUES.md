# Historical R3 router handoff

This document records the earlier R3 source, not the current fully routed R4.
References below to the current source/artifact mean that archived R3 revision.
The small standalone reproducers remain useful; see [VALIDATION.md](../VALIDATION.md)
for current source and validation instructions.
Full-board commands below require the source in the earlier R3 ZIP; running
them on R4's completed manual route does not reproduce the R3 automatic run.

# Pedometer router issue notes — 2026-09-06

**Reviewable source; routing is blocked. Do not fabricate the attached PCB artifacts.**

The current 59-part, 46.6 × 32 mm pedometer fails in Pipeline7's topology
merger where a manually escaped BQ25150 pad meets its own trace. A fresh
installation reproduces this before global routing. Two independent, small
reproducers also demonstrate the topology assertion and route-cache reuse
across solver/effort changes. No installed dependency was patched.

Suggested issue title:
**Pipeline7 fails merging manual BGA escape topology; phase cache ignores solver/effort**

## Start here

From the extracted `bluetooth-pedometer/` directory:

```sh
bun install --frozen-lockfile
bun run typecheck
bun diagnostics/reproduce-topology.mjs
bun diagnostics/reproduce-cache.mjs
```

Run the last two commands separately. Both intentionally exit **1** when the
reported behavior reproduces; inspect their `REPRODUCED:` messages. They do not
edit the circuit or access the project's disk cache. An exit 0 applies only to
that diagnostic, not to the complete board.

The ZIP also contains the exact native solver input for an integration repro
that takes approximately one second on the tested machine:

```sh
bun diagnostics/reproduce-pipeline7.mjs evidence/pipeline7-input.json
```

This stops after topology merging and does not claim to test later routing
stages. The fixture in `evidence/` is distributed in the ZIP, not tracked in Git.
For a source-only checkout, regenerate the input with the native command below;
the first `AutoroutingPipelineSolver7_MultiGraph` entry in the solver-debug JSON
contains `constructor_args[0].input`. Serialized `value_type: "undefined"`
object properties must be omitted before using that input directly.

## 1. Topology merge failure at U2 BAT1

Reproduce from the complete source in a fresh directory, with no copied
`.tscircuit/` cache:

```sh
bunx tsci check netlist index.circuit.tsx
bunx tsci build index.circuit.tsx --solver-debug --solver-debug-dir solver-debug --autorouter-timeout 2m
bun run check:artifact
```

Observed with the supplied lockfile:

```text
TopologyMergingSolver: output nodes "cmn_842" and
"obstacle-pcb_component_5-pcb_component_5:-11.3001:2.199898:0.1999996:0.1999996:top-0--11.3001-2.199898"
have an unresolved inter-group overlap on a shared layer
```

The output contains **1 `pcb_autorouting_error` and 162
`pcb_port_not_connected_error` records**. The solver-debug capture confirms
`AutoroutingPipelineSolver7_MultiGraph`, effort 5.

The two-node fixture was reduced from the actual failing merger input. It
retains only the two reported nodes and their original tags and coordinates:

| Node | Meaning in the complete circuit | Top-layer bounds/identity |
| --- | --- | --- |
| `cmn_842` | Manual BAT1 escape mesh | Center (−11.525075, 2.2249235), size 0.4582416193 × 0.1245912512 mm; `_connectedTo` PCB ports 26 and 90 |
| `obstacle-pcb_component_5-…` | U2 BAT1 pad | Center (−11.3001, 2.199898), size 0.1999996 × 0.1999996 mm; `_targetConnectionName: source_net_7` |

In the complete artifact, port 26 is U2 BAT1, port 90 is its escape via's bottom
port, and `source_net_7` is `VBAT_SYS`. The geometry overlaps at a deliberate
same-net trace termination. The two-node fixture demonstrates the failing
stage; **whether the fix belongs in topology generation, identity propagation,
or merging still needs investigation**. It is not a proposal to permit arbitrary
overlapping nodes or weaken electrical clearances.

The minimal fixture fails on both capacity-autorouter **0.0.866** and the
separately unpacked official **0.0.885** release. The project remains locked to
0.0.866. The complete captured Pipeline7 input also reproduced the failure on
0.0.885 during the preceding review.

## 2. Phase cache ignores solver version and effort

`reproduce-cache.mjs` uses two resistors, one trace, and a new in-memory cache.
It exercises the unmodified core through `Circuit.renderUntilSettled()` and
records native `solver:started` events:

| Request | Observed |
| --- | --- |
| Pipeline7, 1x, empty cache | Pipeline7 starts; phase result is stored |
| Pipeline4, 1x, same cache | Cache hit; no autorouter starts |
| Pipeline4, 1x, fresh cache | Pipeline4 starts — positive control |
| Pipeline7, 1x, another empty cache | Pipeline7 starts; phase result is stored |
| Pipeline7, 5x, same cache | Cache hit; no autorouter starts |

All five tiny circuit renders have zero circuit error records. The observed
phase key is identical:

```text
routes:core@0.0.1836:srj:d798719041c31700
```

In `@tscircuit/core`, `lib/components/primitive-components/Group/Group_localAutoroutingCache.ts`
builds its key from the embedded core version and SRJ hash. The caller checks
that key before selecting solver version/effort. The installed package version
is **0.0.1837**; its embedded cache-key version is **0.0.1836**.

Expected: a changed solver or effort should not silently reuse a different
configuration's phase result. Suggested fix scope: include the resolved solver
identity/version and all result-affecting routing options in the cache identity,
with a regression test covering warm versus fresh runs. The fresh-cache control
matters: simply changing the board property does not currently establish that a
different solver ran.

## 3. Native build reports success despite failed routing

In the fresh-copy test, the native CLI emitted the 163 error records above and
then returned **0**, including these final messages:

```text
Build complete
  Circuits  1 passed
⚠ Build completed with errors
Build exiting with code 0: build finished successfully
```

The project's existing `check:artifact` step returns **1** for that same file,
so `bun run build` fails instead of presenting it as a successful release. It
checks stored errors and independently invokes the bundled native PCB-port
connectivity checker. It also rejects a routing-disabled preview containing
zero recorded errors. Copper-short checking remains a separate build step.

Please clarify the native build exit-code contract or provide a strict mode
that fails on routing/PCB errors. Logs and exit-code files are included.

## Changes already made to the pedometer

- Added 18 external BQ25150 escape vias and two direct paired-ball ties, while
  retaining 0.20 mm drill / 0.45 mm copper through-vias and full imported footprints.
- Corrected VINLS bypass C5 to 4.7 µF. Changed PMIC status pull-ups R6/R7 to
  100 kΩ; retained the fuel-gauge GPOUT pull-up R9 at the recommended 10 kΩ.
- Moved/rotated the MCU cluster to shorten the RF feed; placed both crystals
  beside their oscillator pins, added explicit signal paths and local returns,
  and set zero-via limits on the 11 RF/oscillator signal traces.
- Synchronized the 59-part BOM, electrical notes, bring-up requirements, and
  validation status. All 207 compared connected named-component pin/net mappings
  are preserved.

Verified on the current placement artifact: typecheck and netlist pass; PCB
placement has zero errors and two connector-orientation warnings; explicit
copper passes the all-layer Gerber shorts check at 100 pixels/mm. There are
40 explicit traces and 30 through-vias. These checks **do not verify the missing
global routes**. Full measurements and remaining RF/DFM work are in
[VALIDATION.md](VALIDATION.md) and [DESIGN_REVIEW.md](DESIGN_REVIEW.md).

## Rejected routing alternative

Several native pipelines were tried without changing the requested via sizes.
The closest completed Pipeline9 experiment used axis-aligned escape starts and
a manual bottom-layer VCORE join. It still had **11 error records and three
Gerber short regions**, and it changed fixed crystal paths, inserting signal
vias. It was rejected. A fresh Pipeline4 run of that experiment produced 84
errors. The current circuit retains default Pipeline7.

The ZIP includes the rejected Pipeline9 source as **`.tsx.txt`**, its artifact,
and its shorts log for investigation. That earlier experiment also has R9 at
100 kΩ and predates the final explicit zero-via annotations; it is not the
current source and should not be substituted for it. The artifact itself
records a zero-via violation on a straight-line crystal load trace.

Acceptance for a routing fix: zero recorded PCB errors, every required port
connected, no all-layer copper shorts, retained requested via/clearance rules,
and RF/clock path constraints satisfied in the **final routed artifact**.
Fabrication and assembled RF/power/step-count verification remain separate.

## Environment and attachments

Tested on macOS arm64, Bun 1.3.14. A fresh `bun install --frozen-lockfile`
installed 282 packages and typecheck passed.

| Package | Installed version |
| --- | --- |
| `tscircuit` | 0.0.2464 |
| `@tscircuit/core` | 0.0.1837 |
| `@tscircuit/cli` | 0.1.2021 |
| `@tscircuit/capacity-autorouter` | 0.0.866 |
| `@tscircuit/checks` | 0.0.178 |
| `typescript` | 5.9.3 |

- Source SHA-256: `9aa679fd5b28bbcbf951ab1b2097e2ecbce43f48a6162a5dbd1dd779cae47bf4`
- Lockfile SHA-256: `01e11fb15cbb31b0b79c46f4d611c66ef7998800ffd8eb5e0a4e7378c3a10ce9`
- The ZIP contains source/imports, the lockfile, review documents, small
  reproducers, selected logs, solver input, failed output and clearly labeled
  placement previews. `SHA256SUMS` identifies every included payload file.
- Dependencies, caches, Git history, local environment files, and fabrication
  exports are excluded. The older root PCB snapshot is also excluded because
  it does not certify this revision.
