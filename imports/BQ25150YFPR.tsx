import type { ChipProps } from "@tscircuit/props"

const pinLabels = {
  pin1: ["A1","IN"],
  pin2: ["A2","PMID1"],
  pin3: ["A3","BAT1"],
  pin4: ["A4","GND"],
  pin5: ["B1","N_PG"],
  pin6: ["B2","PMID2"],
  pin7: ["B3","BAT2"],
  pin8: ["B4","TS"],
  pin9: ["C1","N_MR"],
  pin10: ["C2","N_CE"],
  pin11: ["C3","IMAX"],
  pin12: ["C4","ADCIN"],
  pin13: ["D1","VDD"],
  pin14: ["D2","N_INT"],
  pin15: ["D3","N_LP"],
  pin16: ["D4","LSLDO"],
  pin17: ["E1","VIO"],
  pin18: ["E2","SDA"],
  pin19: ["E3","SCL"],
  pin20: ["E4","VINLS"]
} as const

export const BQ25150YFPR = (props: ChipProps<typeof pinLabels>) => {
  return (
    <chip
      pinLabels={pinLabels}
      supplierPartNumbers={{
  "jlcpcb": [
    "C2868498"
  ]
}}
      manufacturerPartNumber="BQ25150YFPR"
      footprint={<footprint>
        <smtpad portHints={["pin1"]} pcbX="-0.8001mm" pcbY="-0.599948mm" radius="0.0999998mm" shape="circle" />
<smtpad portHints={["pin2"]} pcbX="-0.8001mm" pcbY="-0.199898mm" radius="0.0999998mm" shape="circle" />
<smtpad portHints={["pin3"]} pcbX="-0.8001mm" pcbY="0.199898mm" radius="0.0999998mm" shape="circle" />
<smtpad portHints={["pin4"]} pcbX="-0.8001mm" pcbY="0.599948mm" radius="0.0999998mm" shape="circle" />
<smtpad portHints={["pin5"]} pcbX="-0.40005mm" pcbY="-0.599948mm" radius="0.0999998mm" shape="circle" />
<smtpad portHints={["pin6"]} pcbX="-0.40005mm" pcbY="-0.199898mm" radius="0.0999998mm" shape="circle" />
<smtpad portHints={["pin7"]} pcbX="-0.40005mm" pcbY="0.199898mm" radius="0.0999998mm" shape="circle" />
<smtpad portHints={["pin8"]} pcbX="-0.40005mm" pcbY="0.599948mm" radius="0.0999998mm" shape="circle" />
<smtpad portHints={["pin9"]} pcbX="0mm" pcbY="-0.599948mm" radius="0.0999998mm" shape="circle" />
<smtpad portHints={["pin10"]} pcbX="0mm" pcbY="-0.199898mm" radius="0.0999998mm" shape="circle" />
<smtpad portHints={["pin11"]} pcbX="0mm" pcbY="0.199898mm" radius="0.0999998mm" shape="circle" />
<smtpad portHints={["pin12"]} pcbX="0mm" pcbY="0.599948mm" radius="0.0999998mm" shape="circle" />
<smtpad portHints={["pin13"]} pcbX="0.40005mm" pcbY="-0.599948mm" radius="0.0999998mm" shape="circle" />
<smtpad portHints={["pin14"]} pcbX="0.40005mm" pcbY="-0.199898mm" radius="0.0999998mm" shape="circle" />
<smtpad portHints={["pin15"]} pcbX="0.40005mm" pcbY="0.199898mm" radius="0.0999998mm" shape="circle" />
<smtpad portHints={["pin16"]} pcbX="0.40005mm" pcbY="0.599948mm" radius="0.0999998mm" shape="circle" />
<smtpad portHints={["pin17"]} pcbX="0.8001mm" pcbY="-0.599948mm" radius="0.0999998mm" shape="circle" />
<smtpad portHints={["pin18"]} pcbX="0.8001mm" pcbY="-0.199898mm" radius="0.0999998mm" shape="circle" />
<smtpad portHints={["pin19"]} pcbX="0.8001mm" pcbY="0.199898mm" radius="0.0999998mm" shape="circle" />
<smtpad portHints={["pin20"]} pcbX="0.8001mm" pcbY="0.599948mm" radius="0.0999998mm" shape="circle" />
<silkscreenpath route={[{"x":-1.076198000000005,"y":0.8761983999999785},{"x":1.076198000000005,"y":0.8761983999999785},{"x":1.076198000000005,"y":-0.8761983999999927},{"x":-1.076198000000005,"y":-0.8761983999999927},{"x":-1.076198000000005,"y":0.8761983999999785}]} />
<silkscreencircle pcbX="-1.016mm" pcbY="-1.27mm" radius="0.0999998mm" />
<silkscreentext text="{NAME}" pcbX="-0.0254mm" pcbY="1.8636mm" anchorAlignment="center" fontSize="1mm" />
<courtyardoutline outline={[{"x":-1.367599999999996,"y":1.113599999999991},{"x":1.3168000000000148,"y":1.113599999999991},{"x":1.3168000000000148,"y":-1.621600000000015},{"x":-1.367599999999996,"y":-1.621600000000015},{"x":-1.367599999999996,"y":1.113599999999991}]} />
      </footprint>}
      cadModel={{
        objUrl: "https://modelcdn.tscircuit.com/easyeda_models/assets/C2868498.obj?uuid=8f5bf60570c946a0add15337ad8d14e8",
        stepUrl: "https://modelcdn.tscircuit.com/easyeda_models/assets/C2868498.step?uuid=8f5bf60570c946a0add15337ad8d14e8",
        pcbRotationOffset: 0,
        modelOriginPosition: { x: 0, y: 0, z: -0.599999 },
      }}
      {...props}
    />
  )
}