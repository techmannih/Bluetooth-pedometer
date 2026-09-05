import type { ChipProps } from "@tscircuit/props"

const pinLabels = {
  pin1: ["VDDR2"],
  pin2: ["DIO8"],
  pin3: ["DIO9"],
  pin4: ["DIO10"],
  pin5: ["DIO11"],
  pin6: ["DIO12"],
  pin7: ["DIO13"],
  pin8: ["VDDS4"],
  pin9: ["DIO14"],
  pin10: ["DIO15"],
  pin11: ["DIO16_SWDIO"],
  pin12: ["DIO17_SWDCK"],
  pin13: ["DIO18"],
  pin14: ["DIO19"],
  pin15: ["DIO20_A11"],
  pin16: ["DIO21_A10"],
  pin17: ["VDDS3"],
  pin18: ["DIO22_A9"],
  pin19: ["DIO23_A8"],
  pin20: ["DIO24_A7"],
  pin21: ["DIO25_A6"],
  pin22: ["DIO0_A5"],
  pin23: ["DIO1_A4"],
  pin24: ["DIO2_A3"],
  pin25: ["RSTN"],
  pin26: ["DIO3_X32P"],
  pin27: ["DIO4_X32N"],
  pin28: ["VDDD"],
  pin29: ["DIO5_A2"],
  pin30: ["DCDC"],
  pin31: ["VDDS2"],
  pin32: ["DIO6_A1"],
  pin33: ["DIO7_A0"],
  pin34: ["VDDR1"],
  pin35: ["X48P"],
  pin36: ["X48N"],
  pin37: ["NC"],
  pin38: ["VDDS1"],
  pin39: ["ANT"],
  pin40: ["RFGND"],
  pin41: ["EP"]
} as const

const pinAttributes = {
  pin37: {doNotConnect: true}
} as const

export const CC2340R53N0RKPR = (props: ChipProps<typeof pinLabels>) => {
  return (
    <chip
      pinLabels={pinLabels}
      pinAttributes={pinAttributes}
      supplierPartNumbers={{
  "jlcpcb": [
    "C45190532"
  ]
}}
      manufacturerPartNumber="CC2340R53N0RKPR"
      footprint={<footprint>
        <smtpad portHints={["pin41"]} pcbX="0mm" pcbY="0mm" width="3.5999928mm" height="3.5999928mm" shape="rect" />
<smtpad portHints={["pin40"]} pcbX="-2.407412mm" pcbY="-1.800098mm" width="0.6649974mm" height="0.1999996mm" shape="rect" />
<smtpad portHints={["pin39"]} pcbX="-2.407412mm" pcbY="-1.400048mm" width="0.6649974mm" height="0.1999996mm" shape="rect" />
<smtpad portHints={["pin38"]} pcbX="-2.407412mm" pcbY="-0.999998mm" width="0.6649974mm" height="0.1999996mm" shape="rect" />
<smtpad portHints={["pin37"]} pcbX="-2.407412mm" pcbY="-0.599948mm" width="0.6649974mm" height="0.1999996mm" shape="rect" />
<smtpad portHints={["pin36"]} pcbX="-2.407412mm" pcbY="-0.199898mm" width="0.6649974mm" height="0.1999996mm" shape="rect" />
<smtpad portHints={["pin35"]} pcbX="-2.407412mm" pcbY="0.199898mm" width="0.6649974mm" height="0.1999996mm" shape="rect" />
<smtpad portHints={["pin34"]} pcbX="-2.407412mm" pcbY="0.599948mm" width="0.6649974mm" height="0.1999996mm" shape="rect" />
<smtpad portHints={["pin33"]} pcbX="-2.407412mm" pcbY="0.999998mm" width="0.6649974mm" height="0.1999996mm" shape="rect" />
<smtpad portHints={["pin32"]} pcbX="-2.407412mm" pcbY="1.400048mm" width="0.6649974mm" height="0.1999996mm" shape="rect" />
<smtpad portHints={["pin31"]} pcbX="-2.407412mm" pcbY="1.800098mm" width="0.6649974mm" height="0.1999996mm" shape="rect" />
<smtpad portHints={["pin30"]} pcbX="-1.800098mm" pcbY="2.407412mm" width="0.1999996mm" height="0.6649974mm" shape="rect" />
<smtpad portHints={["pin29"]} pcbX="-1.400048mm" pcbY="2.407412mm" width="0.1999996mm" height="0.6649974mm" shape="rect" />
<smtpad portHints={["pin28"]} pcbX="-0.999998mm" pcbY="2.407412mm" width="0.1999996mm" height="0.6649974mm" shape="rect" />
<smtpad portHints={["pin27"]} pcbX="-0.599948mm" pcbY="2.407412mm" width="0.1999996mm" height="0.6649974mm" shape="rect" />
<smtpad portHints={["pin26"]} pcbX="-0.199898mm" pcbY="2.407412mm" width="0.1999996mm" height="0.6649974mm" shape="rect" />
<smtpad portHints={["pin25"]} pcbX="0.199898mm" pcbY="2.407412mm" width="0.1999996mm" height="0.6649974mm" shape="rect" />
<smtpad portHints={["pin24"]} pcbX="0.599948mm" pcbY="2.407412mm" width="0.1999996mm" height="0.6649974mm" shape="rect" />
<smtpad portHints={["pin23"]} pcbX="0.999998mm" pcbY="2.407412mm" width="0.1999996mm" height="0.6649974mm" shape="rect" />
<smtpad portHints={["pin22"]} pcbX="1.400048mm" pcbY="2.407412mm" width="0.1999996mm" height="0.6649974mm" shape="rect" />
<smtpad portHints={["pin21"]} pcbX="1.800098mm" pcbY="2.407412mm" width="0.1999996mm" height="0.6649974mm" shape="rect" />
<smtpad portHints={["pin20"]} pcbX="2.407412mm" pcbY="1.800098mm" width="0.6649974mm" height="0.1999996mm" shape="rect" />
<smtpad portHints={["pin19"]} pcbX="2.407412mm" pcbY="1.400048mm" width="0.6649974mm" height="0.1999996mm" shape="rect" />
<smtpad portHints={["pin18"]} pcbX="2.407412mm" pcbY="0.999998mm" width="0.6649974mm" height="0.1999996mm" shape="rect" />
<smtpad portHints={["pin17"]} pcbX="2.407412mm" pcbY="0.599948mm" width="0.6649974mm" height="0.1999996mm" shape="rect" />
<smtpad portHints={["pin16"]} pcbX="2.407412mm" pcbY="0.199898mm" width="0.6649974mm" height="0.1999996mm" shape="rect" />
<smtpad portHints={["pin15"]} pcbX="2.407412mm" pcbY="-0.199898mm" width="0.6649974mm" height="0.1999996mm" shape="rect" />
<smtpad portHints={["pin14"]} pcbX="2.407412mm" pcbY="-0.599948mm" width="0.6649974mm" height="0.1999996mm" shape="rect" />
<smtpad portHints={["pin13"]} pcbX="2.407412mm" pcbY="-0.999998mm" width="0.6649974mm" height="0.1999996mm" shape="rect" />
<smtpad portHints={["pin12"]} pcbX="2.407412mm" pcbY="-1.400048mm" width="0.6649974mm" height="0.1999996mm" shape="rect" />
<smtpad portHints={["pin11"]} pcbX="2.407412mm" pcbY="-1.800098mm" width="0.6649974mm" height="0.1999996mm" shape="rect" />
<smtpad portHints={["pin10"]} pcbX="1.800098mm" pcbY="-2.407412mm" width="0.1999996mm" height="0.6649974mm" shape="rect" />
<smtpad portHints={["pin9"]} pcbX="1.400048mm" pcbY="-2.407412mm" width="0.1999996mm" height="0.6649974mm" shape="rect" />
<smtpad portHints={["pin8"]} pcbX="0.999998mm" pcbY="-2.407412mm" width="0.1999996mm" height="0.6649974mm" shape="rect" />
<smtpad portHints={["pin7"]} pcbX="0.599948mm" pcbY="-2.407412mm" width="0.1999996mm" height="0.6649974mm" shape="rect" />
<smtpad portHints={["pin6"]} pcbX="0.199898mm" pcbY="-2.407412mm" width="0.1999996mm" height="0.6649974mm" shape="rect" />
<smtpad portHints={["pin5"]} pcbX="-0.199898mm" pcbY="-2.407412mm" width="0.1999996mm" height="0.6649974mm" shape="rect" />
<smtpad portHints={["pin4"]} pcbX="-0.599948mm" pcbY="-2.407412mm" width="0.1999996mm" height="0.6649974mm" shape="rect" />
<smtpad portHints={["pin3"]} pcbX="-0.999998mm" pcbY="-2.407412mm" width="0.1999996mm" height="0.6649974mm" shape="rect" />
<smtpad portHints={["pin2"]} pcbX="-1.400048mm" pcbY="-2.407412mm" width="0.1999996mm" height="0.6649974mm" shape="rect" />
<smtpad portHints={["pin1"]} pcbX="-1.800098mm" pcbY="-2.407412mm" width="0.1999996mm" height="0.6649974mm" shape="rect" />
<silkscreenpath route={[{"x":2.576118799999904,"y":-2.102408799999921},{"x":2.576118799999904,"y":-2.576118800000131},{"x":2.102408799999921,"y":-2.576118800000131}]} />
<silkscreenpath route={[{"x":2.576118799999904,"y":2.102611999999908},{"x":2.576118799999904,"y":2.576321999999891},{"x":2.102408799999921,"y":2.576321999999891}]} />
<silkscreenpath route={[{"x":-2.5763220000001184,"y":2.102611999999908},{"x":-2.5763220000001184,"y":2.576321999999891},{"x":-2.1026120000001356,"y":2.576321999999891}]} />
<silkscreenpath route={[{"x":-2.5763220000001184,"y":-2.102408799999921},{"x":-2.5763220000001184,"y":-2.576118800000131},{"x":-2.1026120000001356,"y":-2.576118800000131}]} />
<silkscreencircle pcbX="-2.159mm" pcbY="-2.857246mm" radius="0.07493mm" />
<silkscreentext text="{NAME}" pcbX="0.014478mm" pcbY="3.737612mm" anchorAlignment="center" fontSize="1mm" />
<courtyardoutline outline={[{"x":-2.9787220000000616,"y":2.987612000000013},{"x":3.0076779999999417,"y":2.987612000000013},{"x":3.0076779999999417,"y":-3.176588000000038},{"x":-2.9787220000000616,"y":-3.176588000000038},{"x":-2.9787220000000616,"y":2.987612000000013}]} />
      </footprint>}
      cadModel={{
        objUrl: "https://modelcdn.tscircuit.com/easyeda_models/assets/C45190532.obj?uuid=a874b490620243669fbb3a335f8c9bd5",
        stepUrl: "https://modelcdn.tscircuit.com/easyeda_models/assets/C45190532.step?uuid=a874b490620243669fbb3a335f8c9bd5",
        pcbRotationOffset: 0,
        modelOriginPosition: { x: -0.000012699999956566899, y: 0, z: 0 },
      }}
      {...props}
    />
  )
}