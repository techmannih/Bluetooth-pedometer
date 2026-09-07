# Bluetooth pedometer fabrication files

This folder contains the current board's fabrication and assembly files for
engineering/factory review. **It is not a released manufacturing order.**
Open items are in [PACKAGE_AUDIT.md](../PACKAGE_AUDIT.md) and
[ASSEMBLY_REQUIREMENTS.md](./ASSEMBLY_REQUIREMENTS.md).

## Files to use

| File | Purpose |
| --- | --- |
| `Gerbers.zip` | PCB upload: four copper layers, top/bottom mask, paste and silk, one outline, plated and non-plated drilling. |
| `BOM.csv` | Assembly upload: 33 grouped orderable parts / 59 fitted references, with LCSC codes. |
| `CPL.csv` | Assembly upload: 59 placements, metric coordinates and counterclockwise angles. |
| `assembly.svg` / `placement-review.csv` | Check reference, centroid, pin 1 and supplier rotation before approving placement. |
| `drill-map.svg` | Human-readable drill drawing; compare with the two Excellon files. |
| `pcb.svg` / `schematic.svg` | PCB preview and complete multi-sheet schematic. |
| `PINMAP.csv` | Physical pin names, nets and PCB port coordinates, including bare test points. |
| `F_Fab.gbr` | Assembly reference artwork; intentionally outside the PCB-upload Gerber ZIP. |
| `validation.json` / `manifest.json` | Export checks, current board metrics, source/artifact hashes and pending review status. |
| `bluetooth-pedometer-cam-review.zip` | Full review bundle, including the three upload files, drawings, documents and exact Circuit JSON. |

The root `BOM.csv` is the engineering BOM. This folder's `BOM.csv` uses JLCPCB
column names. Bare USB test points remain in the copper and drill outputs but
are excluded from the assembly BOM/CPL. J2/J3/J4 through-hole connectors are
included; confirm through-hole assembly availability for the selected service.

## Regenerate after changing the board

Requires Bun and Python 3.9+; the Python packager uses the standard library.

```sh
bun install --frozen-lockfile
bun run export:fabrication
bun run check:fabrication
```

Export runs typecheck and the full gated board build first, then uses pinned
`circuit-json-to-gerber@0.0.104` on the unchanged checked Circuit JSON. It
compares exported drill positions, diameters, slot endpoints and L1–L4 spans
against that JSON. BOM quantities, MPNs, supplier codes and CPL population
must agree. No routed copper, paste, mask or silkscreen is rewritten.

The quick check rejects changed source inputs, edited/missing output files or
inconsistent archives. Regenerate all outputs together. A passing package
check verifies consistency; it does not resolve the pending engineering items.
The exporter package is 0.0.104; its embedded Gerber header currently reports
0.0.103. The manifest records the installed package version without editing
the exporter's header.

## JLCPCB upload sequence

1. Run the checks above. Open the current package's drawings and pending items.
2. For a PCB quote, select **`Gerbers.zip`**, then verify the displayed outline,
   46.6 × 32 mm dimensions, four layers and 1.0 mm thickness. Mask colour is
   green in this source; surface finish, copper thickness and RF stackup need
   an agreed process selection.
3. For assembled boards, upload **`BOM.csv`** and **`CPL.csv`** at the assembly
   step. Check all 59 intended references and exact LCSC matches. Review live
   stock and any substitutions in the order flow.
4. Review every placement against `assembly.svg` and `placement-review.csv`,
   especially the ICs, USB connector, crystals and asymmetric connectors.
   CPL coordinates use the board-centre origin, X −23.3…+23.3 mm and
   Y −16…+16 mm; they are not shifted or mirrored. Source footprint centres
   and rotations are exported; supplier centroid/pin-1 calibration is pending.
5. Use the full CAM review ZIP and assembly requirements when discussing
   fine-pitch clearances, mask/paste/stencil, panel handling and RF stackup.
   Resolve the package audit and factory review items before tooling/payment.

Uploading a quote file does not demonstrate circuit functionality or approve
the layout. No JLCPCB upload or purchase was made by the export script.

Official formats: [Gerber preparation](https://jlcpcb.com/help/article/gerber-files-preparation),
[assembly BOM](https://jlcpcb.com/help/article/bill-of-materials-for-pcb-assembly),
[CPL / pick and place](https://jlcpcb.com/help/article/pick-place-file-for-pcb-assembly).
See [REFERENCE_COMPARISON.md](./REFERENCE_COMPARISON.md) for the two projects
used to identify the missing deliverables.
