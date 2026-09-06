import "tscircuit"
import { BoardRouting } from "./routing"

import {
  ABM11W_48_0000MHZ_7_B1U_T3,
  ABS07_32_768KHZ_9_T,
  A_2450AT18A100E,
  B3B_PH_K_S_LF__SN_,
  BLM18PG221SN1D,
  BM04B_SRSS_TB_LF__SN_,
  BMA400,
  BQ25150YFPR,
  BQ27427YZFR,
  CC2340R53N0RKPR,
  PZ200V_11_05P,
  PZ200V_11_07P,
  SKRPACE010,
  TPS22918DBVR,
  TYPE_C_31_M_12,
} from "./imports/JlcParts"

const BOARD = { width: 46.6, height: 32, cornerRadius: 2 }
const ANTENNA_KEEPOUT = { x: 21, y: 9.5, width: 5.5, height: 5.5 }

// Charger placement; the complete copper paths live in routing.tsx.
const CHARGER = { x: -6, y: 8 }

// Match the rounded board perimeter, but open the antenna exclusion to the
// right board edge. The pour's 0.25 mm edge margin also insets this notch.
// Keepout routing obstacles alone do not clip pours in the current runtime.
const cornerArc = (cx: number, cy: number, startDegrees: number) =>
  Array.from({ length: 33 }, (_, i) => {
    const angle = ((startDegrees + (i * 90) / 32) * Math.PI) / 180
    return {
      x: cx + BOARD.cornerRadius * Math.cos(angle),
      y: cy + BOARD.cornerRadius * Math.sin(angle),
    }
  })
const cornerX = BOARD.width / 2 - BOARD.cornerRadius
const cornerY = BOARD.height / 2 - BOARD.cornerRadius
const antennaLeft = ANTENNA_KEEPOUT.x - ANTENNA_KEEPOUT.width / 2
const antennaBottom = ANTENNA_KEEPOUT.y - ANTENNA_KEEPOUT.height / 2
const antennaTop = ANTENNA_KEEPOUT.y + ANTENNA_KEEPOUT.height / 2
const GND_PLANE_OUTLINE = [
  ...cornerArc(cornerX, -cornerY, -90),
  { x: BOARD.width / 2, y: antennaBottom },
  { x: antennaLeft, y: antennaBottom },
  { x: antennaLeft, y: antennaTop },
  { x: BOARD.width / 2, y: antennaTop },
  ...cornerArc(cornerX, cornerY, 0),
  ...cornerArc(-cornerX, cornerY, 90),
  ...cornerArc(-cornerX, -cornerY, 180),
]

/**
 * Rechargeable Bluetooth pedometer reference design.
 *
 * R4 has complete native manual routing in routing.tsx. Automatic rerouting
 * is disabled to preserve that copper; the build still runs every bundled
 * routing DRC, required-port checks and all-layer Gerber short detection.
 *
 * Power-on sequence:
 * - BQ25150 wakes from USB insertion or a >=2 s press on SW1.
 * - Its LS/LDO rail starts enabled at the 1.8 V reset default.
 * - Firmware writes BQ25150 LDOCTRL (0x1D) = 0xE0 to select 3.0 V.
 * - OLED_EN remains low until the rail is configured and the display is needed.
 *
 * R5 biases /CE high; DIO1 may enable charging only after configuring the cell.
 * R3 limits the charge-current register code, NOT USB input current. Its
 * nominal ~51 mA ceiling assumes ICHARGE_RANGE=0; range=1 doubles that limit.
 * This is a prototype: see DESIGN_REVIEW.md for RF/DFM release blockers.
 */
export const BluetoothPedometer = () => (
  <board
    name="BLUETOOTH_PEDOMETER"
    title="CC2340R5 Low-Power Bluetooth Pedometer"
    width={BOARD.width}
    height={BOARD.height}
    borderRadius={BOARD.cornerRadius}
    thickness="1mm"
    material="fr4"
    layers={4}
    solderMaskColor="#173f2f"
    defaultTraceWidth="0.1mm"
    minTraceWidth="0.075mm"
    minTraceToPadEdgeClearance="0.05mm"
    minPadEdgeToPadEdgeClearance="0.1mm"
    minViaEdgeToPadEdgeClearance="0.1mm"
    minViaHoleEdgeToViaHoleEdgeClearance="0.2mm"
    minViaHoleDiameter="0.20mm"
    minViaPadDiameter="0.45mm"
    allowBlindAndBuriedVias={false}
    autorouter={{ allowViaInPad: false, traceClearance: "0.1mm" }}
    routingDisabled
    schMaxTraceDistance="6mm"
  >
    <schematicsheet name="power" displayName="USB-C, Charger and Fuel Gauge" sheetIndex={1} />
    <schematicsheet name="mcu" displayName="CC2340R5 BLE MCU and RF" sheetIndex={2}>
      <schematicsection name="rf" displayName="2.4 GHz RF filter / antenna" />
    </schematicsheet>
    <schematicsheet name="io" displayName="Accelerometer, OLED and User I/O" sheetIndex={3} />

    <net name="VCORE" isPowerNet />

    {/* Primary return plane; explicitly exclude the antenna region from copper. */}
    <copperpour
      name="GND_PLANE_L2"
      layer="inner1"
      connectsTo="net.GND"
      clearance="0.1mm"
      boardEdgeMargin="0.25mm"
      outline={GND_PLANE_OUTLINE}
      coveredWithSolderMask
    />

    <hole name="H1" diameter="2mm" pcbX={-21} pcbY={14} />
    <hole name="H2" diameter="2mm" pcbX={21.1} pcbY={0} />
    <silkscreentext text="BLE PEDOMETER R4" pcbX={-4} pcbY={14.8} fontSize="0.8mm" />
    <silkscreentext text="ANTENNA - KEEP CLEAR" pcbX={18} pcbY={14.5} fontSize="0.48mm" />

    {/* USB-C power sink. CC1 and CC2 each have the required independent Rd. */}
    <TYPE_C_31_M_12
      name="J1"
      schSheetName="power"
      pcbX={-19.6}
      pcbY={0}
      pcbRotation={270}
      allowOffBoard
      schX={-11}
      schY={4}
      connections={{
        VBUS1: "net.USB_VBUS",
        VBUS2: "net.USB_VBUS",
        GND1: "net.GND",
        GND2: "net.GND",
        EH1: "net.GND",
        EH2: "net.GND",
        EH3: "net.GND",
        EH4: "net.GND",
        CC1: "net.USB_CC1",
        CC2: "net.USB_CC2",
      }}
      noConnect={["DP1", "DN1", "DP2", "DN2", "SBU1", "SBU2"]}
    />
    <silkscreentext text="USB: CHARGE ONLY" pcbX={-19.6} pcbY={-8.3} fontSize="0.45mm" />
    <resistor name="R1" resistance="5.1k" tolerance="1%" footprint="res0402" manufacturerPartNumber="0402WGF5101TCE" supplierPartNumbers={{ jlcpcb: ["C25905"] }} schSheetName="power" pcbX={-20} pcbY={7} schX={-8} schY={5.4} connections={{ pin1: "net.USB_CC1", pin2: "net.GND" }} />
    <resistor name="R2" resistance="5.1k" tolerance="1%" footprint="res0402" manufacturerPartNumber="0402WGF5101TCE" supplierPartNumbers={{ jlcpcb: ["C25905"] }} schSheetName="power" pcbX={-20} pcbY={-7} schX={-8} schY={3.4} connections={{ pin1: "net.USB_CC2", pin2: "net.GND" }} />
    <diode name="D1" variant="tvs" footprint="sod323" manufacturerPartNumber="PESD5V0S1BA" supplierPartNumbers={{ jlcpcb: ["C2827694"] }} schSheetName="power" pcbX={-15.5} pcbY={-2.8} pcbRotation={90} schX={-6.5} schY={3.4} connections={{ pin1: "net.GND", pin2: "net.USB_VBUS" }} />
    <BLM18PG221SN1D name="FB1" schSheetName="power" pcbX={-14.7} pcbY={2} schX={-6} schY={6.383} connections={{ pin1: "net.USB_VBUS", pin2: "net.CHARGER_IN" }} />

    {/* Wearable charger/power path. PMID feeds the default-on programmable LDO. */}
    <BQ25150YFPR
      name="U2"
      schSheetName="power"
      pcbX={CHARGER.x}
      pcbY={CHARGER.y}
      schX={0}
      schY={2.32}
      connections={{
        IN: "net.CHARGER_IN",
        PMID1: "net.SYS_RAW",
        PMID2: "net.SYS_RAW",
        BAT1: "net.VBAT_SYS",
        BAT2: "net.VBAT_SYS",
        GND: "net.GND",
        N_PG: "net.PMIC_PG",
        N_MR: "net.PMIC_MR",
        N_CE: "net.PMIC_CE",
        IMAX: "net.PMIC_IMAX",
        ADCIN: "net.GND",
        VDD: "net.PMIC_VDD_1V8",
        N_INT: "net.PMIC_INT",
        N_LP: "net.PMIC_LP",
        LSLDO: "net.VCORE",
        VIO: "net.VCORE",
        SDA: "net.I2C_SDA",
        SCL: "net.I2C_SCL",
        VINLS: "net.SYS_RAW",
        TS: "net.BAT_NTC",
      }}
    />

    {/* Both VCORE balls and all supply branches are joined in routing.tsx. */}

    <capacitor name="C1" capacitance="4.7uF" maxVoltageRating="10V" footprint="cap0603" manufacturerPartNumber="CL10A475KP8NNNC" supplierPartNumbers={{ jlcpcb: ["C1705"] }} schSheetName="power" pcbX={-10} pcbY={5.2} pcbRotation={180} schX={-4.5} schY={5.8} schOrientation="vertical" connections={{ pin1: "net.CHARGER_IN", pin2: "net.GND" }} />
    <capacitor name="C2" capacitance="10uF" maxVoltageRating="6.3V" footprint="cap0603" manufacturerPartNumber="CL10A106MQ8NNNC" supplierPartNumbers={{ jlcpcb: ["C1691"] }} schSheetName="power" pcbX={-9.6} pcbY={9.8} pcbRotation={180} schX={3.2} schY={5.8} schOrientation="vertical" connections={{ pin1: "net.SYS_RAW", pin2: "net.GND" }} />
    <capacitor name="C3" capacitance="1uF" maxVoltageRating="25V" footprint="cap0402" manufacturerPartNumber="CL05A105KA5NQNC" supplierPartNumbers={{ jlcpcb: ["C52923"] }} schSheetName="power" pcbX={-9.5} pcbY={7.5} pcbRotation={180} schX={3.2} schY={3.9} schOrientation="vertical" connections={{ pin1: "net.VBAT_SYS", pin2: "net.GND" }} />
    <capacitor name="C4" capacitance="4.7uF" maxVoltageRating="10V" footprint="cap0603" manufacturerPartNumber="CL10A475KP8NNNC" supplierPartNumbers={{ jlcpcb: ["C1705"] }} schSheetName="power" pcbX={-5.3} pcbY={4.4} pcbRotation={270} schX={3.27} schY={2} schOrientation="vertical" connections={{ pin1: "net.PMIC_VDD_1V8", pin2: "net.GND" }} />
    <capacitor name="C5" capacitance="4.7uF" maxVoltageRating="10V" footprint="cap0603" manufacturerPartNumber="CL10A475KP8NNNC" supplierPartNumbers={{ jlcpcb: ["C1705"] }} schSheetName="power" pcbX={-2.6} pcbY={10.4} pcbRotation={0} schX={2.62} schY={0.3} schOrientation="vertical" connections={{ pin1: "net.SYS_RAW", pin2: "net.GND" }} />
    {/* 2.8 uF nominal direct VCORE bypass, 3.8 uF including switched C25.
        Check DC bias, tolerances and the external OLED module against TI's
        1–4.7 uF recommended LDO output-capacitance range. */}
    <capacitor name="C6" capacitance="2.2uF" maxVoltageRating="6.3V" footprint="cap0402" manufacturerPartNumber="CL05A225MQ5NSNC" supplierPartNumbers={{ jlcpcb: ["C12530"] }} schSheetName="power" pcbX={-5.4} pcbY={11.6} pcbRotation={90} schX={5.5} schY={4.5} schOrientation="vertical" connections={{ pin1: "net.VCORE", pin2: "net.GND" }} />
    <resistor name="R3" resistance="1.2k" tolerance="1%" footprint="res0402" manufacturerPartNumber="FRC0402F1201TS" supplierPartNumbers={{ jlcpcb: ["C2909307"] }} schSheetName="power" pcbX={-7.4} pcbY={12.1} pcbRotation={90} schX={-3.2} schY={0.5} connections={{ pin1: "net.PMIC_IMAX", pin2: "net.GND" }} />
    {/* Keep the TS bias resistor north of B4, beside its escape. */}
    <resistor name="R4" resistance="10k" tolerance="1%" footprint="res0402" manufacturerPartNumber="0402WGF1002TCE" supplierPartNumbers={{ jlcpcb: ["C25744"] }} schSheetName="power" pcbX={-9.4} pcbY={12.4} pcbRotation={0} schX={-1} schY={-1.2} connections={{ pin1: "net.BAT_NTC", pin2: "net.GND" }} />
    {/* Overrides the PMIC's internal 900k pulldown while VCORE is present.
        Firmware drives DIO1 low only for an approved charge configuration. */}
    <resistor name="R5" resistance="100k" tolerance="1%" footprint="res0402" manufacturerPartNumber="0402WGF1003TCE" supplierPartNumbers={{ jlcpcb: ["C25741"] }} schSheetName="power" pcbX={-7.4} pcbY={3.5} pcbRotation={0} schX={1.5} schY={-1.2} schOrientation="neg_top" connections={{ pin1: "net.PMIC_CE", pin2: "net.VCORE" }} />
    <resistor name="R6" resistance="100k" tolerance="1%" footprint="res0402" manufacturerPartNumber="0402WGF1003TCE" supplierPartNumbers={{ jlcpcb: ["C25741"] }} schSheetName="power" pcbX={-2.4} pcbY={6.2} pcbRotation={0} schX={4.72} schY={0.5} schOrientation="neg_top" connections={{ pin1: "net.PMIC_INT", pin2: "net.VCORE" }} />
    <resistor name="R7" resistance="100k" tolerance="1%" footprint="res0402" manufacturerPartNumber="0402WGF1003TCE" supplierPartNumbers={{ jlcpcb: ["C25741"] }} schSheetName="power" pcbX={-2.4} pcbY={4.2} pcbRotation={0} schX={6.48} schY={0.5} schOrientation="neg_top" connections={{ pin1: "net.PMIC_PG", pin2: "net.VCORE" }} />

    {/* The BQ27427 integrated shunt sits between the cell and charger/system BAT node. */}
    <BQ27427YZFR
      name="U3"
      schSheetName="power"
      pcbX={-10}
      pcbY={-5.5}
      schX={0}
      schY={-4.28}
      schHeight={1}
      connections={{
        BAT: "net.BAT_PACK_POS",
        SRX: "net.VBAT_SYS",
        BIN: "net.GAUGE_BIN",
        VSS1: "net.GND",
        VSS2: "net.GND",
        VDD: "net.GAUGE_VDD_1V8",
        GPOUT: "net.GAUGE_INT",
        SDA: "net.I2C_SDA",
        SCL: "net.I2C_SCL",
      }}
    />
    <capacitor name="C7" capacitance="1uF" maxVoltageRating="25V" footprint="cap0402" manufacturerPartNumber="CL05A105KA5NQNC" supplierPartNumbers={{ jlcpcb: ["C52923"] }} schSheetName="power" pcbX={-13} pcbY={-6} pcbRotation={180} schX={-4.4} schY={-4} schOrientation="vertical" connections={{ pin1: "net.BAT_PACK_POS", pin2: "net.GND" }} />
    <capacitor name="C8" capacitance="2.2uF" maxVoltageRating="6.3V" footprint="cap0402" manufacturerPartNumber="CL05A225MQ5NSNC" supplierPartNumbers={{ jlcpcb: ["C12530"] }} schSheetName="power" pcbX={-7.5} pcbY={-5.5} pcbRotation={0} schX={3.8} schY={-4} schOrientation="vertical" connections={{ pin1: "net.GAUGE_VDD_1V8", pin2: "net.GND" }} />
    <resistor name="R8" resistance="10k" tolerance="1%" footprint="res0402" manufacturerPartNumber="0402WGF1002TCE" supplierPartNumbers={{ jlcpcb: ["C25744"] }} schSheetName="power" pcbX={-10} pcbY={-8} pcbRotation={0} schX={-3.2} schY={-6.5} connections={{ pin1: "net.GAUGE_BIN", pin2: "net.GND" }} />
    <resistor name="R9" resistance="10k" tolerance="1%" footprint="res0402" manufacturerPartNumber="0402WGF1002TCE" supplierPartNumbers={{ jlcpcb: ["C25744"] }} schSheetName="power" pcbX={-7.5} pcbY={-3.6} pcbRotation={0} schX={4.7} schY={-6.5} schOrientation="neg_top" connections={{ pin1: "net.GAUGE_INT", pin2: "net.VCORE" }} />
    <resistor name="R10" resistance="10k" tolerance="1%" footprint="res0402" manufacturerPartNumber="0402WGF1002TCE" supplierPartNumbers={{ jlcpcb: ["C25744"] }} schSheetName="power" pcbX={1} pcbY={2} pcbRotation={0} schX={7} schY={-3.5} schOrientation="neg_top" connections={{ pin1: "net.I2C_SDA", pin2: "net.VCORE" }} />
    <resistor name="R11" resistance="10k" tolerance="1%" footprint="res0402" manufacturerPartNumber="0402WGF1002TCE" supplierPartNumbers={{ jlcpcb: ["C25744"] }} schSheetName="power" pcbX={1} pcbY={0.2} pcbRotation={0} schX={7} schY={-5.2} schOrientation="neg_top" connections={{ pin1: "net.I2C_SCL", pin2: "net.VCORE" }} />
    <B3B_PH_K_S_LF__SN_
      name="J2"
      schSheetName="power"
      pcbX={-18}
      pcbY={-12.8}
      schX={-7.5}
      schY={-5}
      schHeight={0.4}
      connections={{ pin1: "net.BAT_PACK_POS", pin2: "net.BAT_NTC", pin3: "net.GND" }}
    />
    {/* Physical pin order is 3, 2, 1 from left to right in this orientation. */}
    <silkscreentext text="3:GND" pcbX={-20} pcbY={-15.5} fontSize="0.35mm" />
    <silkscreentext text="2:NTC" pcbX={-18} pcbY={-15.5} fontSize="0.35mm" />
    <silkscreentext text="1:BAT+" pcbX={-16} pcbY={-15.5} fontSize="0.35mm" />
    <SKRPACE010
      name="SW1"
      schSheetName="power"
      pcbX={-8.5}
      pcbY={-12.8}
      schX={-5}
      schY={-8.2}
      internallyConnectedPins={[["pin1", "pin2"], ["pin3", "pin4"]]}
      connections={{ pin1: "net.PMIC_MR", pin3: "net.GND" }}
    />
    <silkscreentext text="POWER / SHIP WAKE" pcbX={-8.5} pcbY={-15.3} fontSize="0.48mm" />

    {/* CC2340R5 power, clocks, debug, and GPIO assignment. */}
    <CC2340R53N0RKPR
      name="U1"
      schSheetName="mcu"
      pcbX={9.500000}
      pcbRotation={180} pcbY={7}
      schX={-0.5}
      schY={1}
      schHeight={4.2}
      connections={{
        VDDR1: "net.VDDR",
        VDDR2: "net.VDDR",
        VDDS1: "net.VCORE",
        VDDS2: "net.VCORE",
        VDDS3: "net.VCORE",
        VDDS4: "net.VCORE",
        VDDD: "net.VDDD",
        DCDC: "net.DCDC_SW",
        RFGND: "net.GND",
        EP: "net.GND",
        ANT: "net.RF_RAW",
        X48P: "net.X48_P",
        X48N: "net.X48_N",
        DIO3_X32P: "net.X32_P",
        DIO4_X32N: "net.X32_N",
        RSTN: "net.MCU_RSTN",
        DIO16_SWDIO: "net.SWDIO",
        DIO17_SWDCK: "net.SWDCK",
        DIO8: "net.OLED_SCLK",
        DIO9: "net.PMIC_INT",
        DIO10: "net.GAUGE_INT",
        DIO11: "net.OLED_CS",
        DIO12: "net.OLED_DC",
        DIO13: "net.OLED_RESET",
        DIO14: "net.PMIC_LP",
        DIO15: "net.USER_BUTTON",
        DIO18: "net.ACC_INT1",
        DIO19: "net.OLED_MOSI",
        DIO20_A11: "net.ACC_INT2",
        DIO21_A10: "net.OLED_EN",
        DIO22_A9: "net.PMIC_PG",
        DIO24_A7: "net.I2C_SCL",
        DIO0_A5: "net.I2C_SDA",
        DIO1_A4: "net.PMIC_CE",
      }}
      noConnect={["NC", "DIO23_A8", "DIO25_A6", "DIO2_A3", "DIO5_A2", "DIO6_A1", "DIO7_A0"]}
    />
    <inductor name="L1" inductance="10uH" maxCurrentRating="150mA" footprint="res0603" manufacturerPartNumber="SLM1608100MIT" supplierPartNumbers={{ jlcpcb: ["C2831366"] }} schSheetName="mcu" pcbX={14.800000} pcbY={1.7} pcbRotation={0} schX={-6} schY={2.5} connections={{ pin1: "net.DCDC_SW", pin2: "net.VDDR" }} />
    <capacitor name="C9" capacitance="10uF" maxVoltageRating="6.3V" footprint="cap0603" manufacturerPartNumber="CL10A106MQ8NNNC" supplierPartNumbers={{ jlcpcb: ["C1691"] }} schSheetName="mcu" pcbX={18.000000} pcbY={1.7} pcbRotation={0} schX={-5.2} schY={4} schOrientation="vertical" connections={{ pin1: "net.VDDR", pin2: "net.GND" }} />
    <capacitor name="C10" capacitance="100nF" maxDecouplingTraceLength="1.5mm" maxVoltageRating="16V" footprint="cap0402" manufacturerPartNumber="CL05B104KO5NNNC" supplierPartNumbers={{ jlcpcb: ["C1525"] }} schSheetName="mcu" pcbX={13.15} pcbY={6.5} pcbRotation={90} schX={-1.6} schY={4} schOrientation="vertical" connections={{ pin1: "net.VDDR", pin2: "net.GND" }} />
    <capacitor name="C11" capacitance="1uF" maxVoltageRating="25V" footprint="cap0402" manufacturerPartNumber="CL05A105KA5NQNC" supplierPartNumbers={{ jlcpcb: ["C52923"] }} schSheetName="mcu" pcbX={13.200000} pcbY={3.2} pcbRotation={0} schX={-3.4} schY={4} schOrientation="vertical" connections={{ pin1: "net.VDDD", pin2: "net.GND" }} />
    <capacitor name="C12" capacitance="100nF" maxVoltageRating="16V" footprint="cap0402" manufacturerPartNumber="CL05B104KO5NNNC" supplierPartNumbers={{ jlcpcb: ["C1525"] }} schSheetName="mcu" pcbX={15.900000} pcbY={4.2} pcbRotation={0} schX={3.6} schY={4} schOrientation="vertical" connections={{ pin1: "net.VCORE", pin2: "net.GND" }} />
    <capacitor name="C13" capacitance="100nF" maxVoltageRating="16V" footprint="cap0402" manufacturerPartNumber="CL05B104KO5NNNC" supplierPartNumbers={{ jlcpcb: ["C1525"] }} schSheetName="mcu" pcbX={13.700000} pcbY={4.7} pcbRotation={0} schX={5.1} schY={4} schOrientation="vertical" connections={{ pin1: "net.VCORE", pin2: "net.GND" }} />
    <capacitor name="C14" capacitance="100nF" maxVoltageRating="16V" footprint="cap0402" manufacturerPartNumber="CL05B104KO5NNNC" supplierPartNumbers={{ jlcpcb: ["C1525"] }} schSheetName="mcu" pcbX={5.300000} pcbRotation={180} pcbY={5.1} schX={6.6} schY={4} schOrientation="vertical" connections={{ pin1: "net.VCORE", pin2: "net.GND" }} />
    <capacitor name="C15" capacitance="100nF" maxVoltageRating="16V" footprint="cap0402" manufacturerPartNumber="CL05B104KO5NNNC" supplierPartNumbers={{ jlcpcb: ["C1525"] }} schSheetName="mcu" pcbX={8.500000} pcbY={11.3} pcbRotation={90} schX={8.1} schY={4} schOrientation="vertical" connections={{ pin1: "net.VCORE", pin2: "net.GND" }} />

    {/* Local bypass for the formerly unconnected U1 pin 1 (VDDR2). */}
    <capacitor name="C16" capacitance="100nF" maxVoltageRating="16V" footprint="cap0402" manufacturerPartNumber="CL05B104KO5NNNC" supplierPartNumbers={{ jlcpcb: ["C1525"] }} schSheetName="mcu" pcbX={11.300000} pcbY={11.3} pcbRotation={90} schX={9.6} schY={4} schOrientation="vertical" connections={{ pin1: "net.VDDR", pin2: "net.GND" }} />
    <resistor name="R12" resistance="100k" tolerance="1%" footprint="res0402" manufacturerPartNumber="0402WGF1003TCE" supplierPartNumbers={{ jlcpcb: ["C25741"] }} schSheetName="mcu" pcbX={6.200000} pcbRotation={180} pcbY={2.5} schX={-6} schY={-2.5} schOrientation="neg_top" connections={{ pin1: "net.MCU_RSTN", pin2: "net.VCORE" }} />
    <capacitor name="C17" capacitance="100nF" maxVoltageRating="16V" footprint="cap0402" manufacturerPartNumber="CL05B104KO5NNNC" supplierPartNumbers={{ jlcpcb: ["C1525"] }} schSheetName="mcu" pcbX={5.700000} pcbRotation={180} pcbY={0.6} schX={-6} schY={-4.5} schOrientation="vertical" connections={{ pin1: "net.MCU_RSTN", pin2: "net.GND" }} />

    <ABM11W_48_0000MHZ_7_B1U_T3
      name="Y1"
      schSheetName="mcu"
      pcbX={15.600000}
      pcbY={7}
      pcbRotation={0}
      schX={2.01}
      schY={-3.1}
      connections={{ pin1: "net.X48_P", pin3: "net.X48_N", GND1: "net.GND", GND2: "net.GND" }}
    />
    <ABS07_32_768KHZ_9_T
      name="Y2"
      schSheetName="mcu"
      loadCapacitance="9pF"
      maxTraceLength="5mm"
      pcbX={9.900000}
      pcbY={2.2}
      pcbRotation={0}
      schX={5.51}
      schY={-3.1}
      connections={{ pin1: "net.X32_P", pin2: "net.X32_N" }}
    />
    {/* Via-free oscillator paths and their length limits are in routing.tsx. */}

    <capacitor name="C18" capacitance="12pF" maxVoltageRating="50V" footprint="cap0402" manufacturerPartNumber="0402CG120J500NT" supplierPartNumbers={{ jlcpcb: ["C1547"] }} schSheetName="mcu" pcbRotation={270} pcbX={8.100000} pcbY={-0.2} schX={4.5} schY={-4.8} schOrientation="vertical" connections={{ pin1: "net.X32_P", pin2: "net.GND" }} />
    <capacitor name="C19" capacitance="15pF" maxVoltageRating="50V" footprint="cap0402" manufacturerPartNumber="0402CG150J500NT" supplierPartNumbers={{ jlcpcb: ["C1548"] }} schSheetName="mcu" pcbRotation={270} pcbX={11.700000} pcbY={-0.2} schX={6.5} schY={-4.8} schOrientation="vertical" connections={{ pin1: "net.X32_N", pin2: "net.GND" }} />

    {/* TI source filter followed by a field-tunable antenna matching footprint. */}
    <capacitor name="C20" capacitance="1.5pF" maxVoltageRating="50V" footprint="cap0201" manufacturerPartNumber="GRM0335C1H1R5BA01D" supplierPartNumbers={{ jlcpcb: ["C161414"] }} schSheetName="mcu" schSectionName="rf" pcbX={13} pcbRotation={90} pcbY={9.83} schX={-6} schY={-8.8} schOrientation="vertical" connections={{ pin1: "net.RF_RAW", pin2: "net.GND" }} />
    <inductor name="L2" inductance="2.8nH" footprint="res0201" manufacturerPartNumber="LQP03TN2N8B02D" supplierPartNumbers={{ jlcpcb: ["C206433"] }} schSheetName="mcu" schSectionName="rf" pcbX={14.1} pcbRotation={0} pcbY={9.5} schX={-4} schY={-8} connections={{ pin1: "net.RF_RAW", pin2: "net.RF_FILTERED" }} />
    <capacitor name="C21" capacitance="1.5pF" maxVoltageRating="50V" footprint="cap0201" manufacturerPartNumber="GRM0335C1H1R5BA01D" supplierPartNumbers={{ jlcpcb: ["C161414"] }} schSheetName="mcu" schSectionName="rf" pcbX={15.2} pcbRotation={90} pcbY={9.83} schX={-2} schY={-8.8} schOrientation="vertical" connections={{ pin1: "net.RF_FILTERED", pin2: "net.GND" }} />
    <resistor name="R13" resistance="0" footprint="res0402" manufacturerPartNumber="0402WGF0000TCE" supplierPartNumbers={{ jlcpcb: ["C17168"] }} schSheetName="mcu" schSectionName="rf" pcbX={17.1} pcbRotation={0} pcbY={9.5} schX={0} schY={-8} connections={{ pin1: "net.RF_FILTERED", pin2: "net.RF_ANT" }} />
    <A_2450AT18A100E name="AE1" schSheetName="mcu" schSectionName="rf" pcbX={20.7} pcbRotation={0} pcbY={9.5} schX={3.02} schY={-8} connections={{ pin1: "net.RF_ANT" }} noConnect={["pin2"]} />
    {/* Short, continuous top-layer RF path. Final 50-ohm geometry and
        component values still need the fabricator's stackup and VNA tuning. */}

    <keepout
      shape="rect"
      pcbX={ANTENNA_KEEPOUT.x}
      pcbY={ANTENNA_KEEPOUT.y}
      width={ANTENNA_KEEPOUT.width}
      height={ANTENNA_KEEPOUT.height}
      layers={["bottom", "inner1", "inner2"]}
    />
    <keepout shape="rect" pcbX={ANTENNA_KEEPOUT.x} pcbY={ANTENNA_KEEPOUT.y}
      width={ANTENNA_KEEPOUT.width} height={ANTENNA_KEEPOUT.height}
      layers={["top"]} excludeRefs={[".AE1"]} />

    {/* Four explicit EP returns and external ground stitching are in routing.tsx. */}

    <PZ200V_11_05P
      name="J4"
      schSheetName="mcu"
      pcbX={0}
      pcbY={-14}
      schX={8}
      schY={-1}
      schHeight={0.6}
      connections={{ pin1: "net.VCORE", pin2: "net.SWDIO", pin3: "net.SWDCK", pin4: "net.MCU_RSTN", pin5: "net.GND" }}
    />
    <silkscreentext text="VREF SWDIO SWCLK RST GND" pcbX={0} pcbY={-15.3} fontSize="0.42mm" />

    {/* BMA400 uses I2C at 0x14; SDO is strapped low and CSB high. */}
    <BMA400
      name="U4"
      schSheetName="io"
      pcbX={0}
      pcbY={-4}
      schX={-4}
      schY={2}
      connections={{
        VDD: "net.VCORE",
        VDDIO: "net.VCORE",
        GND: "net.GND",
        GNDIO: "net.GND",
        SDX: "net.I2C_SDA",
        SCX: "net.I2C_SCL",
        SDO: "net.GND",
        CSB: "net.VCORE",
        INT1: "net.ACC_INT1",
        INT2: "net.ACC_INT2",
      }}
      noConnect={["NC1", "NC2"]}
    />
    {/* Ground-plane access north of pin 9, outside its solderable pad. */}

    {/* Escape SDA south of pin 2, away from the adjacent VDDIO fanout. */}

    <capacitor name="C22" capacitance="100nF" maxVoltageRating="16V" footprint="cap0402" manufacturerPartNumber="CL05B104KO5NNNC" supplierPartNumbers={{ jlcpcb: ["C1525"] }} schSheetName="io" pcbX={-3} pcbY={-5.5} schX={-7} schY={0.2} schOrientation="vertical" connections={{ pin1: "net.VCORE", pin2: "net.GND" }} />
    <capacitor name="C23" capacitance="100nF" maxVoltageRating="16V" footprint="cap0402" manufacturerPartNumber="CL05B104KO5NNNC" supplierPartNumbers={{ jlcpcb: ["C1525"] }} schSheetName="io" pcbX={1.3} pcbY={-6.8} schX={-5.5} schY={0.2} schOrientation="vertical" connections={{ pin1: "net.VCORE", pin2: "net.GND" }} />
    <silkscreentext text="+X" pcbX={2} pcbY={-3.5} fontSize="0.5mm" />
    <silkscreentext text="+Y" pcbX={0} pcbY={-1.4} fontSize="0.5mm" />

    {/* The OLED is off by default. QOD is tied to VOUT for active discharge. */}
    <TPS22918DBVR
      name="U5"
      schSheetName="io"
      pcbX={12}
      pcbY={-7}
      schX={2}
      schY={2}
      connections={{ VIN: "net.VCORE", GND: "net.GND", ON: "net.OLED_EN", CT: "net.OLED_CT", VOUT: "net.OLED_VCC", QOD: "net.OLED_VCC" }}
    />
    <resistor name="R14" resistance="1M" tolerance="1%" footprint="res0402" manufacturerPartNumber="0402WGF1004TCE" supplierPartNumbers={{ jlcpcb: ["C26083"] }} schSheetName="io" pcbX={8.4} pcbY={-9} schX={0} schY={-0.1} connections={{ pin1: "net.OLED_EN", pin2: "net.GND" }} />
    <capacitor name="C24" capacitance="1nF" maxVoltageRating="50V" footprint="cap0402" manufacturerPartNumber="0402B102K500NT" supplierPartNumbers={{ jlcpcb: ["C1523"] }} schSheetName="io" pcbX={12} pcbY={-10.2} schX={3.7} schY={0} schOrientation="vertical" connections={{ pin1: "net.OLED_CT", pin2: "net.GND" }} />
    <capacitor name="C25" capacitance="1uF" maxVoltageRating="25V" footprint="cap0402" manufacturerPartNumber="CL05A105KA5NQNC" supplierPartNumbers={{ jlcpcb: ["C52923"] }} schSheetName="io" pcbX={13.4} pcbY={-4.2} schX={5.4} schY={3.4} schOrientation="vertical" connections={{ pin1: "net.OLED_VCC", pin2: "net.GND" }} />
    <PZ200V_11_07P
      name="J3"
      schSheetName="io"
      pcbX={13.5}
      pcbY={-14}
      schX={8}
      schY={2}
      schHeight={0.8}
      connections={{
        pin1: "net.GND",
        pin2: "net.OLED_VCC",
        pin3: "net.OLED_SCLK",
        pin4: "net.OLED_MOSI",
        pin5: "net.OLED_RESET",
        pin6: "net.OLED_DC",
        pin7: "net.OLED_CS",
      }}
    />
    <silkscreentext text="OLED: G V SCK MOSI RST DC CS" pcbX={13.5} pcbY={-15.3} fontSize="0.42mm" />

    <SKRPACE010
      name="SW2"
      schSheetName="io"
      pcbX={19.5}
      pcbY={-7}
      schX={7}
      schY={-2}
      internallyConnectedPins={[["pin1", "pin2"], ["pin3", "pin4"]]}
      connections={{ pin1: "net.USER_BUTTON", pin3: "net.GND" }}
    />
    <resistor name="R15" resistance="100k" tolerance="1%" footprint="res0402" manufacturerPartNumber="0402WGF1003TCE" supplierPartNumbers={{ jlcpcb: ["C25741"] }} schSheetName="io" pcbX={15.9} pcbY={-9.8} schX={4.5} schY={-2} schOrientation="neg_top" connections={{ pin1: "net.USER_BUTTON", pin2: "net.VCORE" }} />
    <silkscreentext text="VIEW" pcbX={19.5} pcbY={-9.1} fontSize="0.55mm" />

    {/* Keyed top-entry JST-SH service connector replaces the four loose test pads. */}
    <BM04B_SRSS_TB_LF__SN_
      name="J5"
      schSheetName="power"
      pcbX={-15}
      pcbY={11.2}
      schX={9}
      schY={1}
      schHeight={0.6}
      connections={{
        pin1: "net.CHARGER_IN",
        pin2: "net.BAT_PACK_POS",
        pin3: "net.VCORE",
        pin4: "net.GND",
      }}
      noConnect={["pin5"]}
    />
    <silkscreentext text="J5: 1IN 2BAT 3VCORE 4GND" pcbX={-15} pcbY={14.6} fontSize="0.42mm" />
    <BoardRouting />
  </board>
)

export default BluetoothPedometer
