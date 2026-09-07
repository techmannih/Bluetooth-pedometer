import { createHash } from "node:crypto"
import { mkdir, mkdtemp, readFile, readdir, writeFile } from "node:fs/promises"
import { spawnSync } from "node:child_process"
import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import { convertCircuitJsonToGerberFiles } from "circuit-json-to-gerber"
import { convertCircuitJsonToAssemblySvg, convertCircuitJsonToStackedSchematicSheetsSvg } from "circuit-to-svg"

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..")
process.chdir(root)
const sha = (bytes) => createHash("sha256").update(bytes).digest("hex")
const run = (cmd, args) => {
  const result = spawnSync(cmd, args, { cwd: root, stdio: "inherit" })
  if (result.error) throw result.error
  if (result.status !== 0) throw new Error(`${cmd} ${args.join(" ")} failed (${result.status})`)
}
async function sourceHashes() {
  const files = ["index.circuit.tsx", "routing.tsx", "BOM.csv", "package.json", "bun.lock", "tsconfig.json", "tscircuit.config.json"]
  async function walk(dir) {
    for (const entry of await readdir(dir, { withFileTypes: true })) {
      const path = `${dir}/${entry.name}`
      if (entry.isDirectory()) await walk(path)
      else if (/\.(tsx?|mjs|py)$/.test(entry.name)) files.push(path)
    }
  }
  for (const dir of ["imports", "scripts"]) await walk(dir)
  return Object.fromEntries(await Promise.all(files.sort().map(async (file) => [file, sha(await readFile(file))])))
}

// Capture before building so an edit during a long build cannot get a fresh manifest.
const inputs = await sourceHashes()
run("bun", ["run", "test:fabrication"])
run("bun", ["run", "typecheck"])
run("bun", ["run", "build"])
const circuitText = await readFile("dist/index/circuit.json", "utf8")
const circuit = JSON.parse(circuitText)
if (circuit.some((e) => e.type.includes("error"))) throw new Error("Circuit contains error records")
await mkdir(".tscircuit", { recursive: true })
const stage = await mkdtemp(resolve(".tscircuit/fabrication-"))
await mkdir(`${stage}/gerbers`)
// Export the exact checked artifact. No copper, drill, paste or silk rewriting.
const gerbers = convertCircuitJsonToGerberFiles(circuit, { flip_y_axis: false })
for (const [name, contents] of Object.entries(gerbers)) {
  if (name.includes("/") || name.includes("..")) throw new Error(`Invalid export path: ${name}`)
  await writeFile(`${stage}/gerbers/${name}`, contents)
}
await writeFile(`${stage}/circuit.json`, circuitText)
await writeFile(`${stage}/assembly.svg`, convertCircuitJsonToAssemblySvg(circuit, { width: 1400, height: 1000 }))
await writeFile(`${stage}/schematic.svg`, convertCircuitJsonToStackedSchematicSheetsSvg(circuit))
await writeFile(`${stage}/pcb.svg`, await readFile("dist/index/pcb.svg"))
if (JSON.stringify(inputs) !== JSON.stringify(await sourceHashes())) {
  throw new Error("Source changed during export; rerun with the completed edits")
}
const exporter = JSON.parse(await readFile("node_modules/circuit-json-to-gerber/package.json", "utf8"))
await writeFile(`${stage}/build-info.json`, JSON.stringify({
  circuit_sha256: sha(circuitText), source_files: inputs,
  exporter: `circuit-json-to-gerber@${exporter.version}`,
  checks: { typecheck: "pass", build: "pass", native_routing: "pass", required_ports: "pass", bundled_gerber_shorts: "pass" },
}, null, 2))
run("python3", ["scripts/package-fabrication.py", "create", stage])
run("python3", ["scripts/package-fabrication.py", "check"])
