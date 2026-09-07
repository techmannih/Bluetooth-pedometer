# Assembly requirements for this board

Status: engineering review; no factory process acceptance recorded.
The Gerbers preserve current source geometry. The package makes no silent
substitutions for the unresolved footprints in [PACKAGE_AUDIT.md](../PACKAGE_AUDIT.md).

| Item | Current design / review requirement |
| --- | --- |
| Board | 46.6 × 32 mm, 1.0 mm FR-4, four copper layers, rounded outline, green mask. All 59 fitted parts are on top. |
| Layer order | F_Cu = top; In1_Cu = inner1; In2_Cu = inner2; B_Cu = bottom. Inner1 includes the GND pour and routed escapes. |
| Vias | 142 through-vias, 0.20 mm drill / 0.45 mm outer copper. All span L1–L4. No blind/buried process is requested. |
| Other drills | 17 round plated holes, four plated USB shell slots, four NPTH holes. See the drill map and export audit for exact dimensions. |
| Fine-pitch routing | Current exported minimum trace width is 0.10 mm. The source's trace-to-pad rule is 0.05 mm; factory clearance acceptance remains pending. Inspect actual geometry under the chosen process rules. |
| U1 | CC2340R53N0RKPR, RKP-40 with exposed pad. Review the imported land difference, exposed-pad paste coverage, ground/thermal connections and stencil. |
| U2/U3 | BQ25150YFPR and BQ27427YZFR ball arrays. Review land/mask/paste dimensions, paste transfer and common/stepped stencil. X-ray first articles. |
| U4/U5 | Review BMA400 and TPS22918 land-pattern differences and supplier CAD discrepancies recorded in the package audit. |
| Paste / mask | Outputs are the source-generated apertures. They have not been redesigned into manufacturer stencil examples or accepted by an assembler. Do not silently apply another board's apertures. |
| Silkscreen | Dense reference labels are retained. Some source text is 0.4–0.5 mm high; check printable stroke/text sizes and pad clearance in CAM. Assembly SVG is a separate placement reference. |
| Panel | Single board supplied. Discuss rails, tooling holes, fiducials and handling with the assembly house; do not place tabs/fixtures inside the antenna region or connector openings. |
| Finish / stackup | Confirm finish, copper weights and actual dielectric stackup. A 50 Ω RF feed requires calculation against that stackup and final-enclosure tuning. |
| Placement | Review all 59 source centroids/rotations against supplier pin 1. No supplier-calibrated orientation sign-off is claimed. J1 has an existing local CAD-origin adjustment. |

Do not substitute another project's 0.15/0.30 mm filled vias or 0.30/0.45 mm
vias: those are different layouts. Current vias are intended outside solderable
lands; inspect that condition in CAM before assigning any fill/cap process.
The full process and electrical notes are in
[FABRICATION_NOTES.md](../FABRICATION_NOTES.md).

USB is for charging; firmware programming uses J4 SWD. Battery, NTC, OLED,
cables and debugger are external items, not extra PCB placements. Verify each
connector's wiring against `PINMAP.csv` and the bring-up guide. The firmware
currently inhibits charging pending a verified cell profile; no automatic
assembly-house firmware flashing is requested in this package.

References: [JLCPCB PCB capabilities](https://jlcpcb.com/capabilities/pcb-capabilities),
[TI CC2340R5](https://www.ti.com/lit/ds/symlink/cc2340r5.pdf),
[TI BQ25150](https://www.ti.com/lit/ds/symlink/bq25150.pdf),
[TI BQ27427](https://www.ti.com/lit/ds/symlink/bq27427.pdf).
