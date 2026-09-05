import "tscircuit"
import type { ChipProps } from "@tscircuit/props"

const pinLabels = {
  pin1: ["pin1"],
  pin2: ["pin2"],
  pin3: ["pin3"]
} as const

export const B3B_PH_K_S_LF__SN_ = (props: ChipProps<typeof pinLabels>) => {
  return (
    <connector
      pinLabels={pinLabels}
      supplierPartNumbers={{
  "jlcpcb": [
    "C131339"
  ]
}}
      manufacturerPartNumber="B3B-PH-K-S(LF)(SN)"
      footprint={
        <footprint insertionDirection="from_above">
          <platedhole portHints={["pin1"]} pcbX="2mm" outerDiameter="1.6mm" holeDiameter="1mm" shape="circle" />
          <platedhole portHints={["pin2"]} pcbX="0mm" outerDiameter="1.6mm" holeDiameter="1mm" shape="circle" />
          <platedhole portHints={["pin3"]} pcbX="-2mm" outerDiameter="1.6mm" holeDiameter="1mm" shape="circle" />
        </footprint>
      }
      cadModel={{
        objUrl: "https://modelcdn.tscircuit.com/easyeda_models/assets/C131339.obj?uuid=dad20adf37e74a59b293d1ce4ac84f72",
        stepUrl: "https://modelcdn.tscircuit.com/easyeda_models/assets/C131339.step?uuid=dad20adf37e74a59b293d1ce4ac84f72",
        pcbRotationOffset: 0,
        modelOriginPosition: { x: 0.000012699999956566899, y: -0.014473299999951506, z: -0.000006799999999973494 },
      }}
      {...props}
    />
  )
}
