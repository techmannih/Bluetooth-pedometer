// In-memory cache only: never reads, clears, or writes .tscircuit/cache.
import { Circuit } from "@tscircuit/core"
import { createElement as h } from "react"

function makeCache() {
  const entries = new Map()
  const events = []
  return {
    events,
    getItem(key) {
      const value = entries.get(key) ?? null
      if (key.startsWith("routes:core@")) events.push({ op: "get", key, hit: value !== null })
      return value
    },
    setItem(key, value) {
      entries.set(key, value)
      if (key.startsWith("routes:core@")) events.push({ op: "set", key })
    },
  }
}

async function render(version, effort, cache) {
  cache.events.length = 0
  const solvers = []
  const circuit = new Circuit({ platform: { localCacheEngine: cache } })
  circuit.on("solver:started", ({ solverName }) => {
    if (solverName.startsWith("Autorouting")) solvers.push(solverName)
  })
  circuit.add(h("board", {
    width: 16, height: 8,
    autorouterVersion: version,
    autorouterEffortLevel: effort,
  },
  h("resistor", { name: "R1", resistance: "1k", footprint: "0402", pcbX: -4 }),
  h("resistor", { name: "R2", resistance: "1k", footprint: "0402", pcbX: 4 }),
  h("trace", { from: ".R1 > .pin2", to: ".R2 > .pin1" })))
  await circuit.renderUntilSettled()
  const errors = circuit.getCircuitJson().filter((item) => item.type.includes("error"))
  if (errors.length) throw new Error("Fixture failed before cache comparison: " + JSON.stringify(errors))
  const result = { version, effort, solvers, phaseCache: [...cache.events] }
  console.log(JSON.stringify(result))
  return result
}

const versionCache = makeCache()
const initial = await render("beta_pipeline7", "1x", versionCache)
if (!initial.solvers.includes("AutoroutingPipelineSolver7_MultiGraph")) {
  throw new Error("Control failed: Pipeline7 did not start")
}
const changedVersion = await render("beta_pipeline4", "1x", versionCache)
// A fresh cache proves this version request really selects Pipeline4.
const fresh = await render("beta_pipeline4", "1x", makeCache())
if (!fresh.solvers.some((name) => /^AutoroutingPipelineSolver4(?:_TinyHypergraph)?$/.test(name))) {
  throw new Error("Control failed: fresh Pipeline4 did not start")
}
const effortCache = makeCache()
await render("beta_pipeline7", "1x", effortCache)
const changedEffort = await render("beta_pipeline7", "5x", effortCache)
const reused = (run) => run.solvers.length === 0 && run.phaseCache.some((event) => event.op === "get" && event.hit)
const failures = [
  reused(changedVersion) && "changing Pipeline7 to Pipeline4 reuses the Pipeline7 phase result",
  reused(changedEffort) && "changing effort from 1x to 5x reuses the 1x phase result",
].filter(Boolean)
if (failures.length) {
  for (const message of failures) console.error("REPRODUCED: " + message)
  process.exitCode = 1
} else {
  console.log("PASS: solver version and effort changes did not reuse these phase results")
}
