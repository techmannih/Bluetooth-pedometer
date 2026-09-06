import type { ChipProps } from "@tscircuit/props"

const pinLabels = {
  pin1: ["pin1"],
  pin2: ["pin2"]
} as const

export const A_2450AT18A100E = (props: ChipProps<typeof pinLabels>) => {
  return (
    <chip
      pinLabels={pinLabels}
      symbol={
        <symbol>
          {/* Keep the antenna label horizontal above the symbol. A named
              downward-facing pin renders its label vertically on the stem. */}
          <schematictext text="ANT" schX={0} schY={0.65} schRotation={0} anchor="center" fontSize={0.18} color="#006464" />
          <schematicpath points={[{"x":0,"y":0},{"x":-0.2,"y":0.2}]} strokeColor="#8D2323" />
          <schematicpath points={[{"x":0.2,"y":0.2},{"x":0,"y":0}]} strokeColor="#8D2323" />
          <schematicpath points={[{"x":0,"y":0},{"x":0,"y":-0.2}]} strokeColor="#8D2323" />
          <port name="pin1" pinNumber={1} aliases={["1"]} direction="down" schX={0} schY={-0.4} schStemLength={0.2} />
          <schematicpath points={[{"x":0,"y":0},{"x":0,"y":0.3}]} strokeColor="#880000" />
          <port name="pin2" pinNumber={2} aliases={["2"]} direction="up" schX={0} schY={0.3} schStemLength={0.2} />
        </symbol>
      }
      supplierPartNumbers={{
  "jlcpcb": [
    "C89334"
  ]
}}
      manufacturerPartNumber="2450AT18A100E"
      footprint={<footprint>
        <smtpad portHints={["pin1"]} pcbX="-1.578102mm" pcbY="0mm" width="0.999998mm" height="1.7500092mm" shape="rect" />
<smtpad portHints={["pin2"]} pcbX="1.578102mm" pcbY="0mm" width="0.999998mm" height="1.7500092mm" shape="rect" />
<silkscreenpath route={[{"x":-0.7619999999998299,"y":0.2540000000000191},{"x":-0.7619999999998299,"y":-0.2539999999999054},{"x":-0.2539999999999054,"y":-0.2539999999999054},{"x":-0.2539999999999054,"y":0.2540000000000191},{"x":-0.7619999999998299,"y":0.2540000000000191}]} />
<silkscreenpath route={[{"x":-1.6759935999999698,"y":1.059967400000005},{"x":1.6759936000000835,"y":1.0499852000000374}]} />
<silkscreenpath route={[{"x":1.5240000000001146,"y":-1.0500105999999505},{"x":-1.6759428000000298,"y":-1.0499852000000374}]} />
<silkscreentext text="{NAME}" pcbX="-0.000254mm" pcbY="2.0668mm" anchorAlignment="center" fontSize="1mm" />
<fabricationnotepath route={[{"x":-1.2597129999999197,"y":0.22793960000001334},{"x":-0.2838195999999016,"y":0.22793960000001334},{"x":-0.2838195999999016,"y":-0.20652739999991354},{"x":-1.2599669999999605,"y":-0.2116073999999344},{"x":-1.2597129999999197,"y":-0.17978119999997944},{"x":-1.2597129999999197,"y":0.22793960000001334}]} strokeWidth="0.254mm" />
<courtyardoutline outline={[{"x":-2.3330539999998336,"y":1.3167999999999438},{"x":2.3325459999999794,"y":1.3167999999999438},{"x":2.3325459999999794,"y":-1.291400000000067},{"x":-2.3330539999998336,"y":-1.291400000000067},{"x":-2.3330539999998336,"y":1.3167999999999438}]} />
      </footprint>}
      cadModel={{
        objUrl: "https://modelcdn.tscircuit.com/easyeda_models/assets/C89334.obj?uuid=cbaa998426f54032b453ce6fafc2cd5a",
        stepUrl: "https://modelcdn.tscircuit.com/easyeda_models/assets/C89334.step?uuid=cbaa998426f54032b453ce6fafc2cd5a",
        pcbRotationOffset: 180,
        modelOriginPosition: { x: 0, y: 0, z: -0.65 },
      }}
      {...props}
    />
  )
}
