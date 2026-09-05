import { pathToFileURL } from "node:url"

// All currents are battery-side averages, not component headline currents.
// Defaults are planning assumptions, NOT measurements of this prototype.
export function estimateRuntime({
  capacityMah = 100,
  usableFraction = 0.8,
  trackingUa = 50,
  displayExtraMa = 12,
  displaySecondsPerDay = 60,
} = {}) {
  for (const value of [capacityMah, usableFraction, trackingUa, displayExtraMa, displaySecondsPerDay]) {
    if (!Number.isFinite(value)) throw new Error("Inputs must be finite numbers")
  }
  if (capacityMah <= 0 || usableFraction <= 0 || usableFraction > 1 || trackingUa <= 0 ||
      displayExtraMa < 0 || displaySecondsPerDay < 0 || displaySecondsPerDay > 86400) {
    throw new Error("Invalid capacity, usable fraction, current, or daily display time")
  }
  const displayAverageUa = displayExtraMa * 1000 * displaySecondsPerDay / 86400
  const averageUa = trackingUa + displayAverageUa
  const days = capacityMah * usableFraction / (averageUa / 1000) / 24
  return { averageUa, displayAverageUa, days, weeks: days / 7 }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const capacityMah = Number(process.argv[2] ?? 100)
  console.log(`Planning only: ${capacityMah} mAh, 80% usable, 50 uA tracking incl. BLE/gauge, +12 mA display.`)
  console.table([0, 60, 300, 600].map(displaySecondsPerDay => {
    const r = estimateRuntime({ capacityMah, displaySecondsPerDay })
    return { "display min/day": displaySecondsPerDay / 60, "average uA": r.averageUa.toFixed(1), days: r.days.toFixed(1), weeks: r.weeks.toFixed(1) }
  }))
  console.log("Replace assumptions with full-cycle battery-terminal measurements. No runtime guarantee.")
}
