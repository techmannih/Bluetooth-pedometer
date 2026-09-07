import type { DiodeProps } from "@tscircuit/props"

const pinLabels = {
  pin1: ["pin1"],
  pin2: ["pin2"]
} as const

export const PESD5V0S1BA = (props: DiodeProps) => {
  const vertical = props.schOrientation === "vertical"
  // Keep the imported bidirectional strokes, enlarged for readability.
  const orient = (points: { x: number; y: number }[]) => points.map(({ x, y }) =>
    vertical ? { x: -2 * y, y: 2 * x } : { x: 2 * x, y: 2 * y })
  return (
    <diode
      variant="tvs"
      pinLabels={pinLabels}
      // TECH PUBLIC C2827694 is bidirectional. The native tvs variant currently
      // falls back to a normal diode, so use the imported bidirectional strokes.
      symbol={
        <symbol>
          <schematictext text={props.name ?? "D"} schX={vertical ? 0.4 : 0} schY={vertical ? 0.14 : 0.55} anchor={vertical ? "left" : "center"} fontSize={0.18} color="#006464" />
          <schematictext text="5V TVS" schX={vertical ? 0.4 : 0} schY={vertical ? -0.14 : -0.55} anchor={vertical ? "left" : "center"} fontSize={0.18} color="#006464" />
          <port name="pin2" pinNumber={2} aliases={["2"]} direction={vertical ? "up" : "right"} schX={vertical ? 0 : 0.6} schY={vertical ? 0.6 : 0} schStemLength={0.2} />
          <port name="pin1" pinNumber={1} aliases={["1"]} direction={vertical ? "down" : "left"} schX={vertical ? 0 : -0.6} schY={vertical ? -0.6 : 0} schStemLength={0.2} />
          <schematicpath points={orient([{x:-0.2,y:0.1},{x:0,y:0},{x:-0.2,y:-0.1},{x:-0.2,y:0.1}])} strokeColor="#880000" strokeWidth={0.02} />
          <schematicpath points={orient([{x:0.2,y:0.1},{x:0,y:0},{x:0.2,y:-0.1},{x:0.2,y:0.1}])} strokeColor="#880000" strokeWidth={0.02} />
          <schematicpath points={orient([{x:-0.04,y:0.12},{x:0,y:0.12},{x:0,y:-0.12},{x:0.04,y:-0.12}])} strokeColor="#880000" strokeWidth={0.02} />
        </symbol>
      }
      supplierPartNumbers={{
  "jlcpcb": [
    "C2827694"
  ]
}}
      manufacturerPartNumber="PESD5V0S1BA"
      // TECH PUBLIC datasheet p4: 3.15 mm overall, two 0.8 x 0.8 mm lands.
      footprint={<footprint>
        <smtpad portHints={["pin2"]} pcbX="1.175mm" pcbY="0mm" width="0.8mm" height="0.8mm" shape="rect" />
<smtpad portHints={["pin1"]} pcbX="-1.175mm" pcbY="0mm" width="0.8mm" height="0.8mm" shape="rect" />
<silkscreenpath route={[{"x":-0.005968999999936386,"y":0.14168119999999362},{"x":-0.005968999999936386,"y":-0.11231880000013916}]} />
<silkscreenpath route={[{"x":0.12103100000001632,"y":0.014681200000040917},{"x":-0.009017000000085318,"y":0.014681200000040917},{"x":-0.2599690000000692,"y":-0.11231880000013916},{"x":-0.2599690000000692,"y":0.14168119999999362},{"x":-0.2599690000000692,"y":0.14168119999999362},{"x":-0.008204200000022865,"y":0.01767840000002252}]} />
<silkscreenpath route={[{"x":-0.13296900000011647,"y":0.014681200000040917},{"x":-0.0029210000000148284,"y":0.014681200000040917},{"x":0.24803099999996903,"y":0.14168119999999362},{"x":0.24803099999996903,"y":-0.11231880000013916},{"x":0.24803099999996903,"y":-0.11231880000013916},{"x":-0.003733800000077281,"y":0.011607799999978852}]} />
<silkscreenpath route={[{"x":-0.8551164000000426,"y":-0.684834799999976},{"x":0.8449055999999473,"y":-0.684834799999976}]} />
<silkscreenpath route={[{"x":-0.8551164000000426,"y":0.7151624000000538},{"x":0.8449055999999473,"y":0.7151624000000538}]} />
<silkscreentext text="{NAME}" pcbX="-0.007112mm" pcbY="1.706374mm" anchorAlignment="center" fontSize="1mm" />
<fabricationnotepath route={[{"x":0.24891999999999825,"y":-0.2388108000000102},{"x":0.24891999999999825,"y":0.2691891999999143},{"x":-0.005080000000020846,"y":0.015189199999895209},{"x":0.24891999999999825,"y":-0.2388108000000102}]} strokeWidth="0.254mm" />
<fabricationnotepath route={[{"x":-0.25908000000003995,"y":0.2691891999999143},{"x":-0.25908000000003995,"y":-0.2388108000000102},{"x":-0.005080000000020846,"y":0.015189199999895209},{"x":-0.25908000000003995,"y":0.2691891999999143}]} strokeWidth="0.254mm" />
<courtyardoutline outline={[{"x":-1.8573120000000927,"y":0.9563740000000962},{"x":1.8430879999998524,"y":0.9563740000000962},{"x":1.8430879999998524,"y":-0.940625999999952},{"x":-1.8573120000000927,"y":-0.940625999999952},{"x":-1.8573120000000927,"y":0.9563740000000962}]} />
      </footprint>}
      cadModel={{
        objUrl: "https://modelcdn.tscircuit.com/easyeda_models/assets/C2827694.obj?uuid=5284e5723bda45e1a33dc55b8531c926",
        stepUrl: "https://modelcdn.tscircuit.com/easyeda_models/assets/C2827694.step?uuid=5284e5723bda45e1a33dc55b8531c926",
        pcbRotationOffset: 0,
        modelOriginPosition: { x: 0.00003810000009707437, y: -0.00016510000000380387, z: 0 },
      }}
      {...props}
    />
  )
}
