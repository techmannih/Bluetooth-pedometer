import type { InductorProps } from "@tscircuit/props"

export const SLM1608100MIT = (props: Omit<InductorProps, "inductance">) => {
  return (
    <inductor
      inductance="10uH"
      maxCurrentRating="150mA"
      supplierPartNumbers={{
  "jlcpcb": [
    "C2831366"
  ]
}}
      manufacturerPartNumber="SLM1608100MIT"
      footprint={<footprint>
        <smtpad portHints={["pin1"]} pcbX="-0.699897mm" pcbY="0mm" width="0.7999984mm" height="0.8640064mm" shape="rect" />
<smtpad portHints={["pin2"]} pcbX="0.699897mm" pcbY="0mm" width="0.7999984mm" height="0.8640064mm" shape="rect" />
<silkscreenpath route={[{"x":-1.2700000000000955,"y":-0.6513575999998693},{"x":-1.4241018000001304,"y":-0.499008399999866},{"x":-1.4241018000001304,"y":0.5174234000000979},{"x":-1.2700000000000955,"y":0.6499860000001263}]} />
<silkscreenpath route={[{"x":1.2699999999998681,"y":0.6499860000001263},{"x":1.4241525999999567,"y":0.49898300000006657},{"x":1.4241525999999567,"y":-0.5174487999998973},{"x":1.2699999999998681,"y":-0.6500114000000394}]} />
<silkscreenpath route={[{"x":-1.272006600000168,"y":0.6499860000001263},{"x":-0.5100066000001107,"y":0.6499860000001263}]} />
<silkscreenpath route={[{"x":1.2720573999999942,"y":-0.6500114000000394},{"x":0.5100573999999369,"y":-0.6500114000000394}]} />
<silkscreenpath route={[{"x":-1.272006600000168,"y":-0.6500114000000394},{"x":-0.5100066000001107,"y":-0.6500114000000394}]} />
<silkscreenpath route={[{"x":1.2720573999999942,"y":0.6499860000001263},{"x":0.5100573999999369,"y":0.6499860000001263}]} />
<silkscreentext text="{NAME}" pcbX="0.009525mm" pcbY="1.63754mm" anchorAlignment="center" fontSize="1mm" />
<courtyardoutline outline={[{"x":-1.6628750000002128,"y":0.8875400000000582},{"x":1.6819249999998647,"y":0.8875400000000582},{"x":1.6819249999998647,"y":-0.9078599999998005},{"x":-1.6628750000002128,"y":-0.9078599999998005},{"x":-1.6628750000002128,"y":0.8875400000000582}]} />
      </footprint>}
      // Nominal package model: Sunltech SLM Rev.03, 1.6 x 0.8 x 0.8 mm.
      // The supplied EasyEDA model is only 0.5 mm tall; it is not used here.
      // This model represents body/contact dimensions, not internal construction.
      cadModel={{
        jscad: {
          type: "union",
          shapes: [
            { type: "colorize", color: [0.18, 0.19, 0.21], shape: {
              type: "translate", vector: [0, 0, 0.4], shape: {
                type: "cuboid", size: [1, 0.8, 0.8],
              },
            } },
            ...[-0.65, 0.65].map(x => ({
              type: "colorize", color: [0.72, 0.74, 0.77], shape: {
                type: "translate", vector: [x, 0, 0.4], shape: {
                  type: "cuboid", size: [0.3, 0.8, 0.8],
                },
              },
            })),
          ],
        },
        modelOriginPosition: { x: 0, y: 0, z: 0 },
        size: { x: 1.6, y: 0.8, z: 0.8 },
      }}
      {...props}
    />
  )
}
