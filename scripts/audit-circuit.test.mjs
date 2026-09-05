import test from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { auditCircuit } from "./audit-circuit.mjs"

// Integration regression tests intentionally require the current routed build.
// Run the CLI audit first: it also rejects stale artifacts.
const source = JSON.parse(readFileSync(new URL("../dist/index/circuit.json", import.meta.url), "utf8"))
const bom = readFileSync(new URL("../BOM.csv", import.meta.url), "utf8")
const copy = () => structuredClone(source)
const component = (d, name) => d.find(x => x.type === "source_component" && x.name === name)
const findPort = (d, name, pin) => d.find(x => x.type === "source_port" &&
  x.source_component_id === component(d, name).source_component_id && x.port_hints.includes(pin))

test("current routed board satisfies electrical and procurement contracts", () => {
  assert.deepEqual(auditCircuit(source, bom).issues, [])
})
test("regression: disconnected second VDDR pin is caught", () => {
  const d = copy()
  const p = findPort(d, "U1", "VDDR2")
  for (const t of d.filter(x => x.type === "source_trace")) {
    t.connected_source_port_ids = t.connected_source_port_ids.filter(id => id !== p.source_port_id)
  }
  assert.ok(auditCircuit(d, bom).issues.includes("U1.VDDR2 must connect to VDDR"))
})
test("regression: charge-enable pulldown is caught", () => {
  const d = copy()
  const p = findPort(d, "R5", "pin2")
  const ground = d.find(x => x.type === "source_net" && x.name === "GND")
  for (const t of d.filter(x => x.type === "source_trace" && x.connected_source_port_ids.includes(p.source_port_id))) {
    t.connected_source_net_ids = [ground.source_net_id]
  }
  assert.ok(auditCircuit(d, bom).issues.includes("R5.pin2 must connect to VCORE"))
})
test("excess regulator capacitance is caught", () => {
  const d = copy()
  component(d, "C6").capacitance = 10e-6
  assert.ok(auditCircuit(d, bom).issues.some(x => x.includes("LDO capacitance")))
})
test("BOM mismatch is caught", () => {
  assert.ok(auditCircuit(source, bom.replace("C1691", "C000000")).issues.some(x => x.includes("source/BOM part mismatch")))
})
test("build error records cannot be masked by exit status zero", () => {
  const d = copy()
  d.push({ type: "pcb_trace_error", message: "test route failure" })
  assert.ok(auditCircuit(d, bom).issues.some(x => x.includes("test route failure")))
})
test("unrouted output is rejected", () => {
  assert.ok(auditCircuit(source.filter(x => x.type !== "pcb_trace"), bom).issues.some(x => x.includes("No routed PCB traces")))
})
test("dedicated SDA escape cannot silently disappear", () => {
  const d = source.filter(x => !(x.type === "pcb_via" && Math.abs(x.x - 4.400048) < 1e-4 && Math.abs(x.y - 6.2) < 1e-4))
  assert.ok(auditCircuit(d, bom).issues.includes("Missing dedicated MCU SDA escape via"))
})
test("a hand-routed link alone cannot make a placement-only build pass", () => {
  const firstTrace = source.find(x => x.type === "pcb_trace")
  const d = source.filter(x => x.type !== "pcb_trace" || x === firstTrace)
  assert.ok(auditCircuit(d, bom).issues.some(x => x.includes("missing routed PCB endpoint")))
})
test("battery connector and power button retain 4 mm pad-bound spacing", () => {
  const pcb = name => source.find(x => x.type === "pcb_component" &&
    x.source_component_id === component(source, name).source_component_id)
  const battery = pcb("J2")
  const button = pcb("SW1")
  const gap = button.center.x - button.width / 2 - (battery.center.x + battery.width / 2)
  assert.ok(gap >= 4, `J2–SW1 horizontal pad-bound gap is only ${gap.toFixed(3)} mm`)
})
