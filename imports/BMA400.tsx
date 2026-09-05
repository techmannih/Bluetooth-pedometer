import type { ChipProps } from "@tscircuit/props"

const pinLabels = {
  pin1: ["SDO"],
  pin2: ["SDX"],
  pin3: ["VDDIO"],
  pin4: ["NC2"],
  pin5: ["INT1"],
  pin6: ["INT2"],
  pin7: ["VDD"],
  pin8: ["GNDIO"],
  pin9: ["GND"],
  pin10: ["CSB"],
  pin11: ["NC1"],
  pin12: ["SCX"]
} as const

const pinAttributes = {
  pin4: {doNotConnect: true},
  pin7: {requiresPower: true},
  pin9: {requiresGround: true},
  pin11: {doNotConnect: true}
} as const

export const BMA400 = (props: ChipProps<typeof pinLabels>) => {
  return (
    <chip
      pinLabels={pinLabels}
      pinAttributes={pinAttributes}
      supplierPartNumbers={{
  "jlcpcb": [
    "C437655"
  ]
}}
      manufacturerPartNumber="BMA400"
      footprint={<footprint>
        <smtpad portHints={["pin12"]} pcbX="-0.87503mm" pcbY="-0.249936mm" width="0.499999mm" height="0.2800096mm" shape="rect" />
<smtpad portHints={["pin11"]} pcbX="-0.87503mm" pcbY="0.249936mm" width="0.499999mm" height="0.2800096mm" shape="rect" />
<smtpad portHints={["pin10"]} pcbX="-0.750062mm" pcbY="0.87503mm" width="0.2800096mm" height="0.499999mm" shape="rect" />
<smtpad portHints={["pin9"]} pcbX="-0.249936mm" pcbY="0.87503mm" width="0.2800096mm" height="0.499999mm" shape="rect" />
<smtpad portHints={["pin8"]} pcbX="0.249936mm" pcbY="0.87503mm" width="0.2800096mm" height="0.499999mm" shape="rect" />
<smtpad portHints={["pin7"]} pcbX="0.750062mm" pcbY="0.87503mm" width="0.2800096mm" height="0.499999mm" shape="rect" />
<smtpad portHints={["pin6"]} pcbX="0.87503mm" pcbY="0.249936mm" width="0.499999mm" height="0.2800096mm" shape="rect" />
<smtpad portHints={["pin5"]} pcbX="0.87503mm" pcbY="-0.249936mm" width="0.499999mm" height="0.2800096mm" shape="rect" />
<smtpad portHints={["pin4"]} pcbX="0.750062mm" pcbY="-0.87503mm" width="0.2800096mm" height="0.499999mm" shape="rect" />
<smtpad portHints={["pin3"]} pcbX="0.249936mm" pcbY="-0.87503mm" width="0.2800096mm" height="0.499999mm" shape="rect" />
<smtpad portHints={["pin2"]} pcbX="-0.249936mm" pcbY="-0.87503mm" width="0.2800096mm" height="0.499999mm" shape="rect" />
<smtpad portHints={["pin1"]} pcbX="-0.750062mm" pcbY="-0.87503mm" width="0.2800096mm" height="0.499999mm" shape="rect" />
<silkscreenpath route={[{"x":-1.2699999999999818,"y":-0.5080000000000382},{"x":-1.2699999999999818,"y":-1.1429999999999154},{"x":-1.0441178000000946,"y":-1.1429999999999154}]} />
<silkscreenpath route={[{"x":-1.0160000000000764,"y":1.143000000000029},{"x":-1.2699999999999818,"y":1.143000000000029},{"x":-1.2699999999999818,"y":0.5080000000000382}]} />
<silkscreenpath route={[{"x":1.2699999999999818,"y":-0.5080000000000382},{"x":1.2699999999999818,"y":-1.1429999999999154},{"x":1.0160000000000764,"y":-1.1429999999999154}]} />
<silkscreenpath route={[{"x":1.0160000000000764,"y":1.143000000000029},{"x":1.2699999999999818,"y":1.143000000000029},{"x":1.2699999999999818,"y":0.5080000000000382}]} />
<silkscreencircle pcbX="-0.750062mm" pcbY="-1.457452mm" radius="0.07493mm" />
<silkscreentext text="{NAME}" pcbX="-0.004064mm" pcbY="2.132332mm" anchorAlignment="center" fontSize="1mm" />
<courtyardoutline outline={[{"x":-1.524063999999953,"y":1.3823320000000194},{"x":1.515935999999897,"y":1.3823320000000194},{"x":1.515935999999897,"y":-1.7846680000000106},{"x":-1.524063999999953,"y":-1.7846680000000106},{"x":-1.524063999999953,"y":1.3823320000000194}]} />
      </footprint>}
      cadModel={{
        objUrl: "https://modelcdn.tscircuit.com/easyeda_models/assets/C437655.obj?uuid=83ec6157b4954879af30009d604f164f",
        stepUrl: "https://modelcdn.tscircuit.com/easyeda_models/assets/C437655.step?uuid=83ec6157b4954879af30009d604f164f",
        pcbRotationOffset: 90,
        modelOriginPosition: { x: 0, y: 0, z: 0 },
      }}
      {...props}
    />
  )
}