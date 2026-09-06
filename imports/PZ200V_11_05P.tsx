import type { ChipProps } from "@tscircuit/props"

const pinLabels = {
  pin1: ["pin1"],
  pin2: ["pin2"],
  pin3: ["pin3"],
  pin4: ["pin4"],
  pin5: ["pin5"]
} as const

export const PZ200V_11_05P = (props: ChipProps<typeof pinLabels>) => {
  return (
    <chip
      pinLabels={pinLabels}
      supplierPartNumbers={{
  "jlcpcb": [
    "C541859"
  ]
}}
      manufacturerPartNumber="PZ200V-11-05P"
      footprint={<footprint insertionDirection="from_above">
        <platedhole  portHints={["pin5"]} pcbX="3.999992mm" pcbY="0mm" outerDiameter="1.3999972mm" holeDiameter="0.9000236mm" shape="circle" />
<platedhole  portHints={["pin4"]} pcbX="1.999996mm" pcbY="0mm" outerDiameter="1.3999972mm" holeDiameter="0.9000236mm" shape="circle" />
<platedhole  portHints={["pin3"]} pcbX="-0mm" pcbY="0mm" outerDiameter="1.3999972mm" holeDiameter="0.9000236mm" shape="circle" />
<platedhole  portHints={["pin2"]} pcbX="-1.999996mm" pcbY="0mm" outerDiameter="1.3999972mm" holeDiameter="0.9000236mm" shape="circle" />
<platedhole  portHints={["pin1"]} pcbX="-3.999992mm" pcbY="0mm" outerDiameter="1.524mm" holeDiameter="0.9000236mm" shape="circle" />
<silkscreenpath route={[{"x":-2.999994000000129,"y":0.999998000000005},{"x":-2.999994000000129,"y":-0.999998000000005}]} />
<silkscreenrect pcbX="0mm" pcbY="0mm" width="9.99998mm" height="1.999996mm" strokeWidth="0.254mm" />
<silkscreentext text="{NAME}" pcbX="-0.02032mm" pcbY="1.9906mm" anchorAlignment="center" fontSize="1mm" />
<courtyardoutline outline={[{"x":-5.286820000000034,"y":1.2405999999999722},{"x":5.2461799999998675,"y":1.2405999999999722},{"x":5.2461799999998675,"y":-1.2913999999999533},{"x":-5.286820000000034,"y":-1.2913999999999533},{"x":-5.286820000000034,"y":1.2405999999999722}]} />
      </footprint>}
      cadModel={{
        objUrl: "https://modelcdn.tscircuit.com/easyeda_models/assets/C541859.obj?uuid=59a9ecc3af8647ea88334177855570b2",
        stepUrl: "https://modelcdn.tscircuit.com/easyeda_models/assets/C541859.step?uuid=59a9ecc3af8647ea88334177855570b2",
        pcbRotationOffset: 0,
        modelOriginPosition: { x: 0, y: 0, z: 0.19999400000000023 },
      }}
      {...props}
    />
  )
}
