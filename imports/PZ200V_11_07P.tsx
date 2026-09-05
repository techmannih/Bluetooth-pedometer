import type { ChipProps } from "@tscircuit/props"

const pinLabels = {
  pin1: ["pin1"],
  pin2: ["pin2"],
  pin3: ["pin3"],
  pin4: ["pin4"],
  pin5: ["pin5"],
  pin6: ["pin6"],
  pin7: ["pin7"]
} as const

export const PZ200V_11_07P = (props: ChipProps<typeof pinLabels>) => {
  return (
    <connector
      pinLabels={pinLabels}
      supplierPartNumbers={{
  "jlcpcb": [
    "C541861"
  ]
}}
      manufacturerPartNumber="PZ200V-11-07P"
      footprint={<footprint insertionDirection="from_above">
        <platedhole  portHints={["pin7"]} pcbX="5.999988mm" pcbY="0mm" outerDiameter="1.3999972mm" holeDiameter="0.9000236mm" shape="circle" />
<platedhole  portHints={["pin6"]} pcbX="3.999992mm" pcbY="0mm" outerDiameter="1.3999972mm" holeDiameter="0.9000236mm" shape="circle" />
<platedhole  portHints={["pin5"]} pcbX="1.999996mm" pcbY="0mm" outerDiameter="1.3999972mm" holeDiameter="0.9000236mm" shape="circle" />
<platedhole  portHints={["pin4"]} pcbX="-0mm" pcbY="0mm" outerDiameter="1.3999972mm" holeDiameter="0.9000236mm" shape="circle" />
<platedhole  portHints={["pin3"]} pcbX="-1.999996mm" pcbY="0mm" outerDiameter="1.3999972mm" holeDiameter="0.9000236mm" shape="circle" />
<platedhole  portHints={["pin2"]} pcbX="-3.999992mm" pcbY="0mm" outerDiameter="1.3999972mm" holeDiameter="0.9000236mm" shape="circle" />
<platedhole  portHints={["pin1"]} pcbX="-5.999988mm" pcbY="0mm" outerDiameter="1.524mm" holeDiameter="0.9000236mm" shape="circle" />
<silkscreenpath route={[{"x":-4.969002000000273,"y":1.0159999999999627},{"x":-4.969002000000273,"y":-0.88900000000001}]} />
<silkscreenrect pcbX="0mm" pcbY="0mm" width="13.999972mm" height="1.999996mm" strokeWidth="0.254mm" />
<silkscreentext text="{NAME}" pcbX="-0.026416mm" pcbY="2.016mm" anchorAlignment="center" fontSize="1mm" />
<courtyardoutline outline={[{"x":-7.286816000000044,"y":1.2659999999999627},{"x":7.233983999999737,"y":1.2659999999999627},{"x":7.233983999999737,"y":-1.2913999999999533},{"x":-7.286816000000044,"y":-1.2913999999999533},{"x":-7.286816000000044,"y":1.2659999999999627}]} />
      </footprint>}
      cadModel={{
        objUrl: "https://modelcdn.tscircuit.com/easyeda_models/assets/C541861.obj?uuid=f62ae0b40c5a45078f02d1bb9a0fea45",
        stepUrl: "https://modelcdn.tscircuit.com/easyeda_models/assets/C541861.step?uuid=f62ae0b40c5a45078f02d1bb9a0fea45",
        pcbRotationOffset: 0,
        modelOriginPosition: { x: 0, y: 0, z: 0.19999400000000023 },
      }}
      {...props}
    />
  )
}
