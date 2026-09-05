import { readFileSync, readdirSync, statSync } from "node:fs"
import { fileURLToPath, pathToFileURL } from "node:url"
import path from "node:path"

// A successful CLI exit alone is insufficient: inspect the produced netlist,
// error records and procurement metadata as well. This is NOT a vendor DFM check.
export function auditCircuit(data, bomText) {
  const issues = []
  const expect = (condition, message) => { if (!condition) issues.push(message) }
  const rows = type => data.filter(x => x.type === type)
  const components = rows("source_component")
  const ports = rows("source_port")
  const nets = rows("source_net")
  const parent = new Map()
  const root = id => {
    if (!parent.has(id)) parent.set(id, id)
    if (parent.get(id) !== id) parent.set(id, root(parent.get(id)))
    return parent.get(id)
  }
  for (const trace of rows("source_trace")) {
    const ids = [...(trace.connected_source_port_ids ?? []), ...(trace.connected_source_net_ids ?? [])]
    for (const id of ids.slice(1)) parent.set(root(id), root(ids[0]))
  }
  const component = name => components.find(x => x.name === name)
  const port = (name, pin) => ports.find(x => x.source_component_id === component(name)?.source_component_id &&
    (x.name === pin || x.port_hints?.includes(pin) || `pin${x.pin_number}` === pin))
  const onNet = (name, pin, net) => {
    const p = port(name, pin)
    const n = nets.find(x => x.name === net)
    return Boolean(p && n && root(p.source_port_id) === root(n.source_net_id))
  }
  const contracts = {
    U1: { VDDR1: "VDDR", VDDR2: "VDDR", VDDD: "VDDD", DCDC: "DCDC_SW",
      VDDS1: "VCORE", VDDS2: "VCORE", VDDS3: "VCORE", VDDS4: "VCORE",
      RFGND: "GND", EP: "GND", DIO1_A4: "PMIC_CE", DIO14: "PMIC_LP",
      DIO0_A5: "I2C_SDA", DIO24_A7: "I2C_SCL", DIO21_A10: "OLED_EN" },
    U2: { N_CE: "PMIC_CE", N_LP: "PMIC_LP", IN: "CHARGER_IN", VINLS: "SYS_RAW",
      LSLDO: "VCORE", VIO: "VCORE", BAT1: "VBAT_SYS", BAT2: "VBAT_SYS", TS: "BAT_NTC" },
    R5: { pin1: "PMIC_CE", pin2: "VCORE" },
    D1: { pin1: "GND", pin2: "USB_VBUS" },
    U3: { BAT: "BAT_PACK_POS", SRX: "VBAT_SYS", VSS1: "GND", VSS2: "GND" },
    U4: { VDD: "VCORE", VDDIO: "VCORE", CSB: "VCORE", SDO: "GND",
      SDX: "I2C_SDA", SCX: "I2C_SCL", INT1: "ACC_INT1", INT2: "ACC_INT2" },
    U5: { VIN: "VCORE", VOUT: "OLED_VCC", QOD: "OLED_VCC", ON: "OLED_EN", GND: "GND" },
    C16: { pin1: "VDDR", pin2: "GND" },
    J2: { pin1: "BAT_PACK_POS", pin2: "BAT_NTC", pin3: "GND" },
    J3: { pin1: "GND", pin2: "OLED_VCC", pin3: "OLED_SCLK", pin4: "OLED_MOSI",
      pin5: "OLED_RESET", pin6: "OLED_DC", pin7: "OLED_CS" },
    J4: { pin1: "VCORE", pin2: "SWDIO", pin3: "SWDCK", pin4: "MCU_RSTN", pin5: "GND" },
    J5: { pin1: "CHARGER_IN", pin2: "BAT_PACK_POS", pin3: "VCORE", pin4: "GND" },
  }
  for (const [name, pins] of Object.entries(contracts)) {
    for (const [pin, net] of Object.entries(pins)) expect(onNet(name, pin, net), `${name}.${pin} must connect to ${net}`)
  }
  // A placement-only build can contain hand-routed traces, so trace count > 0
  // is not evidence that the rest of the board is routed. Check critical
  // non-ground endpoints too. Ground may connect through the copper pour.
  const routedPorts = new Set(rows("pcb_trace").flatMap(t => [
    ...(t.connectsTo ?? []),
    ...(t.route ?? []).flatMap(p => [p.start_pcb_port_id, p.end_pcb_port_id]),
  ]).filter(Boolean))
  for (const [name, pins] of Object.entries(contracts)) {
    for (const [pin, net] of Object.entries(pins)) {
      if (net === "GND") continue
      const p = port(name, pin)
      const pcbPorts = rows("pcb_port").filter(x => x.source_port_id === p?.source_port_id)
      expect(pcbPorts.some(x => routedPorts.has(x.pcb_port_id)), `${name}.${pin}: missing routed PCB endpoint`)
    }
  }
  const domains = ["GND", "USB_VBUS", "CHARGER_IN", "BAT_PACK_POS", "VBAT_SYS", "SYS_RAW", "VCORE", "VDDR", "VDDD", "OLED_VCC"]
  const domainRoots = domains.map(name => {
    const n = nets.find(x => x.name === name)
    expect(n, `Missing power domain ${name}`)
    return n ? root(n.source_net_id) : name
  })
  expect(new Set(domainRoots).size === domains.length, "Power domains accidentally merged")

  const bypass = rail => components.filter(c => c.ftype === "simple_capacitor" &&
    ((onNet(c.name, "pin1", rail) && onNet(c.name, "pin2", "GND")) ||
     (onNet(c.name, "pin2", rail) && onNet(c.name, "pin1", "GND"))))
    .reduce((sum, c) => sum + c.capacitance, 0)
  const ldoCap = bypass("VCORE") + bypass("OLED_VCC")
  expect(ldoCap >= 1e-6 && ldoCap <= 4.7e-6, "On-board LDO capacitance outside TI's recommended 1–4.7 uF range")
  expect(component("C5")?.capacitance >= 1e-6, "C5 VINLS local bypass must be at least 1 uF nominal")
  expect(component("C9")?.capacitance === 10e-6, "Keep the 10 uF VDDR reservoir")
  expect(component("R3")?.resistance === 1200, "Recalculate IMAX documentation if R3 changes")
  expect(component("R5")?.resistance === 100000, "Review charge-enable pull-up if R5 changes")
  const sda = nets.find(x => x.name === "I2C_SDA")
  expect(rows("pcb_via").some(v => Math.abs(v.x - 4.400048) < 1e-4 &&
    Math.abs(v.y - 6.2) < 1e-4 && v.source_net_id === sda?.source_net_id),
    "Missing dedicated MCU SDA escape via")

  // BOM.csv deliberately uses simple unquoted fields. Refuse ambiguous rows.
  const bom = new Map()
  for (const line of bomText.trim().split(/\r?\n/).slice(1)) {
    const fields = line.split(",")
    expect(fields.length === 6 && !line.includes('"'), `Unsupported BOM CSV row: ${line}`)
    const [references, quantity, mpn, code] = fields
    const names = references.trim().split(/\s+/)
    expect(names.length === Number(quantity), `BOM quantity mismatch: ${references}`)
    for (const name of names) {
      expect(!bom.has(name), `Duplicate BOM refdes ${name}`)
      bom.set(name, { mpn, code })
    }
  }
  expect(components.length === 59 && bom.size === 59, "Expected 59 fitted components")
  for (const c of components) {
    const row = bom.get(c.name)
    expect(row && c.manufacturer_part_number === row.mpn && c.supplier_part_numbers?.jlcpcb?.includes(row.code), `${c.name}: source/BOM part mismatch`)
    const model = rows("cad_component").find(x => x.source_component_id === c.source_component_id)
    const native = ["simple_resistor", "simple_capacitor", "simple_inductor", "simple_diode"].includes(c.ftype)
    expect(native
      ? model && (model.footprinter_string || model.model_jscad || model.model_obj_url || model.model_glb_url || model.model_stl_url)
      : model?.model_obj_url && model?.model_step_url,
      `${c.name}: missing ${native ? "native/supplier CAD" : "OBJ/STEP model"} metadata`)
  }
  for (const e of data.filter(x => /error/.test(x.type))) issues.push(`${e.type}: ${e.message ?? JSON.stringify(e)}`)
  expect(rows("pcb_trace").length > 0, "No routed PCB traces: build without --routing-disabled first")
  expect(rows("pcb_copper_pour").length > 0 || rows("pcb_copper_pour_fragment").length > 0,
    "Missing ground pour")
  return { issues, components: components.length, routedTraces: rows("pcb_trace").length,
    vias: rows("pcb_via").length, onBoardLdoCapUf: ldoCap * 1e6 }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const project = fileURLToPath(new URL("../", import.meta.url))
  const artifact = path.resolve(project, process.argv[2] ?? "dist/index/circuit.json")
  const sources = ["index.circuit.tsx", "tscircuit.config.json", ...readdirSync(path.join(project, "imports")).filter(n => /\.tsx?$/.test(n)).map(n => `imports/${n}`)]
  if (sources.some(file => statSync(path.join(project, file)).mtimeMs > statSync(artifact).mtimeMs)) {
    throw new Error("Stale circuit JSON: rebuild the current source before auditing")
  }
  const report = auditCircuit(JSON.parse(readFileSync(artifact, "utf8")), readFileSync(path.join(project, "BOM.csv"), "utf8"))
  console.log(JSON.stringify(report, null, 2))
  console.log("This audit does not certify PCB fabrication, RF performance, physical CAD accuracy, or battery safety.")
  process.exitCode = report.issues.length ? 1 : 0
}
