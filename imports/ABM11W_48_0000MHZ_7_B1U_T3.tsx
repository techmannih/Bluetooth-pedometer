import type { ChipProps } from "@tscircuit/props"

const pinLabels = {
  pin1: ["pin1"],
  pin2: ["GND1"],
  pin3: ["pin3"],
  pin4: ["GND2"],
} as const

const pinAttributes = {
  pin2: { requiresGround: true },
  pin4: { requiresGround: true },
} as const

export const ABM11W_48_0000MHZ_7_B1U_T3 = (props: ChipProps<typeof pinLabels>) => {
  return (
    <chip
      pinLabels={pinLabels}
      pinAttributes={pinAttributes}
      symbol={
        <symbol>
          <port name="pin1" pinNumber={1} aliases={["1"]} direction="left" schX={-0.6} schY={0} schStemLength={0.2} />
          <port name="pin3" pinNumber={3} aliases={["3"]} direction="right" schX={0.6} schY={0} schStemLength={0.2} />
          <port name="pin2" pinNumber={2} aliases={["GND1", "2"]} direction="down" schX={-0.2} schY={-0.45} schStemLength={0.15} />
          <port name="pin4" pinNumber={4} aliases={["GND2", "4"]} direction="down" schX={0.2} schY={-0.45} schStemLength={0.15} />
          <schematicpath points={[{ x: -0.4, y: 0 }, { x: -0.15, y: 0 }]} strokeColor="#880000" strokeWidth={0.02} />
          <schematicpath points={[{ x: -0.15, y: -0.25 }, { x: -0.15, y: 0.25 }]} strokeColor="#880000" strokeWidth={0.03} />
          <schematicrect schX={0} schY={0} width={0.16} height={0.4} strokeWidth={0.02} color="#880000" />
          <schematicpath points={[{ x: 0.15, y: -0.25 }, { x: 0.15, y: 0.25 }]} strokeColor="#880000" strokeWidth={0.03} />
          <schematicpath points={[{ x: 0.15, y: 0 }, { x: 0.4, y: 0 }]} strokeColor="#880000" strokeWidth={0.02} />
          <schematicpath points={[{ x: -0.25, y: -0.3 }, { x: 0.25, y: -0.3 }]} strokeColor="#880000" strokeWidth={0.02} />
        </symbol>
      }
      supplierPartNumbers={{
  "jlcpcb": [
    "C1985532"
  ]
}}
      manufacturerPartNumber="ABM11W-48.0000MHZ-7-B1U-T3"
      footprint={<footprint>
        <smtpad portHints={["pin2"]} pcbX="0.700024mm" pcbY="-0.549783mm" width="0.8999982mm" height="0.7999984mm" shape="rect" />
<smtpad portHints={["pin3"]} pcbX="0.700024mm" pcbY="0.550037mm" width="0.8999982mm" height="0.7999984mm" shape="rect" />
<smtpad portHints={["pin4"]} pcbX="-0.700024mm" pcbY="0.550037mm" width="0.8999982mm" height="0.7999984mm" shape="rect" />
<smtpad portHints={["pin1"]} pcbX="-0.700024mm" pcbY="-0.549783mm" width="0.8999982mm" height="0.7999984mm" shape="rect" />
<silkscreenpath route={[{"x":-1.6499840000000177,"y":-0.1498853999999028},{"x":-1.6499840000000177,"y":-1.4498827999999548},{"x":-0.24998679999987417,"y":-1.4498827999999548}]} />
<silkscreenrect pcbX="0mm" pcbY="0mm" width="2.70002mm" height="2.29997mm" strokeWidth="0.151999696mm" />
<silkscreentext text="{NAME}" pcbX="-0.1524mm" pcbY="2.143127mm" anchorAlignment="center" fontSize="1mm" />
<courtyardoutline outline={[{"x":-1.9009999999999536,"y":1.3931270000000495},{"x":1.5962000000001808,"y":1.3931270000000495},{"x":1.5962000000001808,"y":-1.6976729999998952},{"x":-1.9009999999999536,"y":-1.6976729999998952},{"x":-1.9009999999999536,"y":1.3931270000000495}]} />
      </footprint>}
      cadModel={{
        objUrl: "https://modelcdn.tscircuit.com/easyeda_models/assets/C1985532.obj?uuid=51ae9b24ba7a408881f7752b57b66e45",
        stepUrl: "https://modelcdn.tscircuit.com/easyeda_models/assets/C1985532.step?uuid=51ae9b24ba7a408881f7752b57b66e45",
        pcbRotationOffset: 0,
        modelOriginPosition: { x: 0, y: -0.00011430000006384944, z: -0.01 },
      }}
      {...props}
    />
  )
}
