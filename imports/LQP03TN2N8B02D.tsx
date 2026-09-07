import type { InductorProps } from "@tscircuit/props"

export const LQP03TN2N8B02D = (props: Omit<InductorProps, "inductance">) => {
  return (
    <inductor
      inductance="2.8nH"
      maxCurrentRating="500mA"
      supplierPartNumbers={{
  "jlcpcb": [
    "C206433"
  ]
}}
      manufacturerPartNumber="LQP03TN2N8B02D"
      // Murata O05E, RF soldering: a=0.25, b=0.85, c=0.25 mm.
      // 0.25 mm courtyard margin around the lands and 0.6 x 0.3 mm body.
      footprint={<footprint>
        <smtpad portHints={["pin2"]} pcbX="0.275mm" pcbY="0mm" width="0.3mm" height="0.25mm" shape="rect" />
<smtpad portHints={["pin1"]} pcbX="-0.275mm" pcbY="0mm" width="0.3mm" height="0.25mm" shape="rect" />
<fabricationnotepath route={[{x:-0.3,y:-0.15},{x:0.3,y:-0.15},{x:0.3,y:0.15},{x:-0.3,y:0.15},{x:-0.3,y:-0.15}]} strokeWidth="0.05mm" />
<silkscreenpath route={[{x:-0.18,y:0.3},{x:0.18,y:0.3}]} strokeWidth="0.1mm" />
<silkscreenpath route={[{x:-0.18,y:-0.3},{x:0.18,y:-0.3}]} strokeWidth="0.1mm" />
<silkscreentext text="{NAME}" pcbX="0mm" pcbY="0.7mm" anchorAlignment="center" fontSize="0.45mm" />
<courtyardoutline outline={[{x:-0.675,y:0.4},{x:0.675,y:0.4},{x:0.675,y:-0.4},{x:-0.675,y:-0.4},{x:-0.675,y:0.4}]} />
      </footprint>}
      cadModel={{
        objUrl: "https://modelcdn.tscircuit.com/easyeda_models/assets/C206433.obj?uuid=fa57e36e003e4ee2b14b14feaebd32e1",
        stepUrl: "https://modelcdn.tscircuit.com/easyeda_models/assets/C206433.step?uuid=fa57e36e003e4ee2b14b14feaebd32e1",
        pcbRotationOffset: 0,
        modelOriginPosition: { x: 0, y: 0.000012699999956566899, z: -0.01 },
      }}
      {...props}
    />
  )
}
