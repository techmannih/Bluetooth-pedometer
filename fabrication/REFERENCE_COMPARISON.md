# Reference-project file comparison — 2026-09-07

Inspected the public registry file lists and the relevant source documents:

| Project | Inspected release | Public files |
| --- | --- | --- |
| [AnasSarkiz/ble-pedometer](https://tscircuit.com/AnasSarkiz/ble-pedometer#files) | 1.0.7; `94eaf959-3a56-4415-8861-8738e7976a17` | 72 total, including 29 imports |
| [imrishabh18/pedometer](https://tscircuit.com/imrishabh18/pedometer#files) | 1.1.3; `1c7b0745-f622-4f7d-8d72-542968f288fb` | 175 total, including 30 imports |

The user reported orders for these designs. Their latest public files do not
establish approval of those exact revisions. Anas's fabrication notes mark its
export as review-only. Rishabh's current manifest says `factory-cam-review`;
its fabrication review says process/RF acceptance is pending and describes
an earlier passive-footprint rejection. These are useful workflow references,
not proof that all their present files are ready for tooling.

## What was missing here

| Reference-project files | Purpose | This repository |
| --- | --- | --- |
| Rishabh `fabrication/BOM.csv`, `CPL.csv`, `Gerbers.zip` | PCB and assembly uploads | Added equivalent files generated from our own checked circuit and locked BOM. |
| Rishabh `fabrication/manifest.json`, CAM review ZIP | Keep exported revisions and checksums together | Added manifest, validation report and `bluetooth-pedometer-cam-review.zip`. |
| Both projects' manufacturing export scripts | Reproducible output with drill/population checks | Added `scripts/export-fabrication.mjs` and `scripts/package-fabrication.py`, using official Gerber exporter 0.0.104. |
| Rishabh `review/assembly.svg`, placement review | Assembly reference and orientation review | Added `assembly.svg`, `placement-review.csv`, `pcb.svg` and full `schematic.svg`. |
| Rishabh drill-export audit; Anas physical-span check | Detect wrong drill layers/duplicate hits | Added source-to-Excellon comparison of counts, diameters, coordinates and slot endpoints; only L1–L4 PTH plus NPTH allowed. Added drill map. |
| Anas `PINMAP.md`; Rishabh interface/programming docs | Wiring and bring-up reference | Added generated `PINMAP.csv`; existing README and `FIRMWARE_BRINGUP.md` cover interfaces/programming. |
| Assembly requirements / fabrication notes | Communicate the specific board's process needs | Added concise assembly requirements and upload guide; retained the full existing fabrication notes. |
| Datasheet/footprint/model audit docs | Record known geometry issues | Already covered by `PACKAGE_AUDIT.md`, `JLCPCB_PARTS.md`, `DESIGN_REVIEW.md` and `VALIDATION.md`. |
| Power-budget documents | Estimated battery life and assumptions | Already discussed in README and DESIGN_REVIEW; their numerical budgets use different hardware and are not copied. |
| Firmware, vendor drivers and desktop reader | Operate/test a built board | Our target firmware, BMA400 vendor code, BLE protocol and tests already exist. Their reader targets another protocol and is not required for PCB ordering. |
| BGA/router shims, alternate radio source, import wrappers and old regression patches | Implement or investigate their particular layouts | Not missing deliverables for this board. Our MCU package, connectors, charger arrangement and explicit routing differ. |
| `dist/index.js`, `.cjs`, `.d.ts`, HTML and 3D preview | Published package/site outputs | Not JLCPCB fabrication inputs; extra copies would not improve the order package. |

No third-party board geometry, firmware, BOM/CPL coordinates or manufacturing
transform was copied into this design. In particular, their stencil apertures,
silkscreen replacements, charger substitutions and via sizes do not apply
automatically to our RKP-40 / BQ25150 board. Downloaded comparison evidence is
stored locally under ignored `checks/reference-fabrication/`.

Sources: the two project links above, especially Anas `FABRICATION_NOTES.md`
and `lib/get-manufacturing-review.ts`, and Rishabh
`docs/fabrication-review.md`, `docs/assembly-requirements.md`,
`fabrication/manifest.json`, and `scripts/package-cam.py`.
Official upload formats are linked in this folder's README.
