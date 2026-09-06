// Runs the captured native SRJ through topology merging only. No disk cache,
// board rewriting, or long high-density routing is involved.
import { readFile } from "node:fs/promises"
import { AutoroutingPipelineSolver7_MultiGraph } from "@tscircuit/capacity-autorouter"

if (!process.argv[2]) throw new Error("Usage: bun diagnostics/reproduce-pipeline7.mjs <pipeline7-input.json>")
const input = JSON.parse(await readFile(process.argv[2], "utf8"))
const solver = new AutoroutingPipelineSolver7_MultiGraph(input, { effort: 5 })
const start = performance.now()
let topologyError
try {
  while (!solver.solved && !solver.failed && !solver.topologyMergingSolver?.solved) {
    if (performance.now() - start > 30_000) throw new Error("Topology reproduction exceeded 30 seconds")
    solver.step()
  }
} catch (error) {
  if (!String(error).includes("unresolved inter-group overlap")) throw error
  topologyError = error.message
}
console.log(JSON.stringify({
  phase: solver.getCurrentPhase(),
  topologySolved: solver.topologyMergingSolver?.solved ?? false,
  failed: solver.failed,
  error: topologyError ?? solver.error ?? null,
  elapsedMs: Math.round(performance.now() - start),
}, null, 2))
if (solver.failed || topologyError) process.exitCode = 1
else console.log("PASS: topology merging finished; downstream routing has not been tested")
