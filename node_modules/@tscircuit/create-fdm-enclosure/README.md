# @tscircuit/create-fdm-enclosure

A staged solver that turns board dimensions and wall apertures into an open-top
FDM enclosure represented as a serializable JSCAD plan.

All numeric inputs are millimetres. Enclosure width, height, and depth are
inferred from the board unless explicitly supplied.

## Solver usage

`CreateFdmEnclosureSolver` is the primary API. Constructing the solver directly
lets an integrator expose its constructor parameters to the standard tscircuit
solver debugger before solving it.

```ts
import {
  CreateFdmEnclosureSolver,
  type CreateFdmEnclosureInput,
} from "@tscircuit/create-fdm-enclosure"

const input: CreateFdmEnclosureInput = {
  board: { width: 40, height: 24, thickness: 1.6 },
  apertures: [
    {
      shape: "pill",
      wall: "front",
      width: 9,
      height: 3.6,
      margin: 0.5,
      offset: 0,
      centerZ: 5.9,
    },
  ],
}

const solver = new CreateFdmEnclosureSolver(input)
solver.solve()

if (solver.failed) {
  throw new Error(solver.error ?? "Failed to create FDM enclosure")
}

const enclosure = solver.getOutput()

console.log(enclosure.dimensions)
console.log(enclosure.jscadPlan)
```

Inside `tscircuit/core`, emit the standard event after construction and before
calling `solve()`. The debugger can recreate the solver from `solverParams` and
use `step()`, `visualize()`, and the pipeline stage metadata.

```ts
const solver = new CreateFdmEnclosureSolver(input)

this.root?.emit("solver:started", {
  type: "solver:started",
  solverName: solver.getSolverName(),
  solverParams: solver.getConstructorParams()[0],
  componentName: this.getString(),
})

solver.solve()
const enclosure = solver.getOutput()
```

For callers that do not need solver lifecycle access, `createFdmEnclosure(input)`
is available as a convenience wrapper.

## Input coordinates

The enclosure is centred on X/Y with its outside floor at Z = 0. `front` is
the -Y wall, `right` is +X, `back` is +Y, and `left` is -X. Aperture `offset`
is measured from the wall midpoint (along X for front/back and along Y for
left/right); `centerZ` is measured from the outside floor.

The default wall thickness is 2 mm, board clearance is 1 mm per side, and
clearance above the board is 6 mm. An explicit outside dimension is accepted
only when it can still contain the board and its configured clearances.

The Cosmos fixtures combine the standard tscircuit solver debugger with an
interactive GLB preview. Run them locally with `bun start`.
