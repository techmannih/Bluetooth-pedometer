import test from "node:test"
import assert from "node:assert/strict"
import { estimateRuntime } from "./power-budget.mjs"

test("unit conversion and reserve capacity", () => {
  const r = estimateRuntime({ displaySecondsPerDay: 0 })
  assert.equal(r.averageUa, 50)
  assert.ok(Math.abs(r.days - 66.6666666667) < 1e-8)
})
test("display duty cycle and battery scaling", () => {
  const r = estimateRuntime()
  assert.ok(Math.abs(r.displayAverageUa - 8.3333333333) < 1e-8)
  assert.equal(estimateRuntime({ capacityMah: 200 }).days, 2 * r.days)
  assert.ok(estimateRuntime({ displaySecondsPerDay: 600 }).days < r.days)
})
test("invalid inputs cannot produce optimistic or infinite runtime", () => {
  for (const values of [{ capacityMah: 0 }, { capacityMah: NaN }, { usableFraction: 1.1 },
    { usableFraction: 0 }, { trackingUa: 0 }, { displayExtraMa: -1 },
    { displaySecondsPerDay: -1 }, { displaySecondsPerDay: 86401 }, { trackingUa: Infinity }]) {
    assert.throws(() => estimateRuntime(values))
  }
})
