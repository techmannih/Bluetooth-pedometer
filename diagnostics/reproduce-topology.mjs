// Diagnostic only. This does not route or modify the pedometer.
import { readFile } from "node:fs/promises"
import { AutoroutingPipelineSolver7_MultiGraph } from "@tscircuit/capacity-autorouter"

const input = JSON.parse(await readFile(new URL("./topology-overlap.json", import.meta.url), "utf8"))
// TopologyMergingSolver is not a public named export. Obtain the unmodified
// class from Pipeline7's phase definition; no dependency patch is needed.
const pipeline = new AutoroutingPipelineSolver7_MultiGraph({
  bounds: { minX: -15, maxX: 0, minY: -5, maxY: 10 },
  obstacles: [],
  connections: [],
  layerCount: 4,
  minTraceWidth: 0.075,
})
const phase = pipeline.pipelineDef.find((step) => step.solverName === "topologyMergingSolver")
if (!phase) throw new Error("Pipeline API changed: locate TopologyMergingSolver in the new version")
const solver = new phase.solverClass(input)
try {
  solver.solve()
  if (!solver.solved || solver.failed) throw new Error(solver.error ?? "Topology did not solve")
  console.log("PASS: the two-node topology fixture merged successfully")
} catch (error) {
  if (!String(error).includes("unresolved inter-group overlap")) throw error
  console.error("REPRODUCED: " + error.message)
  process.exitCode = 1
}
