import type { ChipProps } from "@tscircuit/props"

const pinLabels = {
  pin1: ["A1","GPOUT"],
  pin2: ["B1","BIN"],
  pin3: ["C1","VSS1"],
  pin4: ["A2","SDA"],
  pin5: ["B2","VSS2"],
  pin6: ["C2","SRX"],
  pin7: ["A3","SCL"],
  pin8: ["B3","VDD"],
  pin9: ["C3","BAT"]
} as const

export const BQ27427YZFR = (props: ChipProps<typeof pinLabels>) => {
  return (
    <chip
      pinLabels={pinLabels}
      supplierPartNumbers={{
  "jlcpcb": [
    "C6075475"
  ]
}}
      manufacturerPartNumber="BQ27427YZFR"
      footprint={<footprint>
        <smtpad portHints={["pin1"]} pcbX="-0.499999mm" pcbY="0.499999mm" radius="0.1200023mm" shape="circle" />
<smtpad portHints={["pin2"]} pcbX="-0.499999mm" pcbY="0.000127mm" radius="0.1200023mm" shape="circle" />
<smtpad portHints={["pin3"]} pcbX="-0.499999mm" pcbY="-0.499999mm" radius="0.1200023mm" shape="circle" />
<smtpad portHints={["pin4"]} pcbX="0.000127mm" pcbY="0.499999mm" radius="0.1200023mm" shape="circle" />
<smtpad portHints={["pin5"]} pcbX="0.000127mm" pcbY="0.000127mm" radius="0.1200023mm" shape="circle" />
<smtpad portHints={["pin6"]} pcbX="0.000127mm" pcbY="-0.499999mm" radius="0.1200023mm" shape="circle" />
<smtpad portHints={["pin7"]} pcbX="0.499999mm" pcbY="0.499999mm" radius="0.1200023mm" shape="circle" />
<smtpad portHints={["pin8"]} pcbX="0.499999mm" pcbY="0.000127mm" radius="0.1200023mm" shape="circle" />
<smtpad portHints={["pin9"]} pcbX="0.499999mm" pcbY="-0.499999mm" radius="0.1200023mm" shape="circle" />
<silkscreenpath route={[{"x":-0.8859774000000016,"y":0.8664955999998938},{"x":0.8864346000000296,"y":0.8664955999998938},{"x":0.8864346000000296,"y":-0.8658606000001328},{"x":-0.8859774000000016,"y":-0.8658606000001328},{"x":-0.8859774000000016,"y":0.8664955999998938}]} />
<silkscreencircle pcbX="-1.286129mm" pcbY="0.499999mm" radius="0.100076mm" />
<silkscreentext text="{NAME}" pcbX="-0.254381mm" pcbY="1.867791mm" anchorAlignment="center" fontSize="1mm" />
<courtyardoutline outline={[{"x":-1.6346810000000005,"y":1.1177909999998974},{"x":1.1259190000000672,"y":1.1177909999998974},{"x":1.1259190000000672,"y":-1.1094090000000278},{"x":-1.6346810000000005,"y":-1.1094090000000278},{"x":-1.6346810000000005,"y":1.1177909999998974}]} />
      </footprint>}
      cadModel={{
        objUrl: "https://modelcdn.tscircuit.com/easyeda_models/assets/C6075475.obj?uuid=2ca51a507e444609a2e12240e03fe96e",
        stepUrl: "https://modelcdn.tscircuit.com/easyeda_models/assets/C6075475.step?uuid=2ca51a507e444609a2e12240e03fe96e",
        pcbRotationOffset: 0,
        modelOriginPosition: { x: 0.000012700000070253736, y: -0.00008889999992334197, z: -0.26 },
      }}
      {...props}
    />
  )
}