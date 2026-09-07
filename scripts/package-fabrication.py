"""Package this board's checked exports; Python standard library only."""
import collections
import csv
import hashlib
import io
import json
import math
import re
import sys
import zipfile
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'fabrication'
LAYERS = {'top', 'inner1', 'inner2', 'bottom'}
GERBERS = {'F_Cu.gbr', 'In1_Cu.gbr', 'In2_Cu.gbr', 'B_Cu.gbr',
           'F_Mask.gbr', 'B_Mask.gbr', 'F_Paste.gbr', 'B_Paste.gbr',
           'F_SilkScreen.gbr', 'B_SilkScreen.gbr', 'Edge_Cuts.gbr'}
DRILLS = {'drill-L1-L4.drl', 'drill_npth.drl'}
GUIDES = ['README.md', 'ASSEMBLY_REQUIREMENTS.md', 'REFERENCE_COMPARISON.md']
ROOT_DOCS = ['PACKAGE_AUDIT.md', 'FABRICATION_NOTES.md', 'FIRMWARE_BRINGUP.md',
             'JLCPCB_PARTS.md', 'README.md']


def require(condition, message):
    if not condition:
        raise ValueError(message)


def sha(data):
    return hashlib.sha256(data).hexdigest()


def csv_bytes(fields, rows):
    text = io.StringIO(newline='')
    writer = csv.DictWriter(text, fieldnames=fields, lineterminator='\n')
    writer.writeheader()
    writer.writerows(rows)
    return text.getvalue().encode()


def natural(ref):
    return [int(s) if s.isdigit() else s for s in re.split(r'(\d+)', ref)]


def assembly_files(circuit):
    source = {e['source_component_id']: e for e in circuit if e['type'] == 'source_component'}
    fitted = {}
    for pcb in [e for e in circuit if e['type'] == 'pcb_component']:
        part = source.get(pcb['source_component_id'])
        if not part or pcb.get('do_not_place') or part.get('ftype') in ('simple_test_point', 'simple_testpoint'):
            continue
        name = part['name']
        require(name not in fitted, f'Duplicate placement: {name}')
        require(part.get('manufacturer_part_number'), f'Missing MPN: {name}')
        fitted[name] = (part, pcb)
    bom, refs = [], set()
    for row in csv.DictReader(io.StringIO((ROOT / 'BOM.csv').read_text())):
        names = row['Reference'].split()
        require(len(names) == int(row['Quantity']), f'BOM quantity mismatch: {names}')
        require(len(set(names)) == len(names) and not refs.intersection(names), 'Duplicate BOM reference')
        require(re.fullmatch(r'C\d+', row['LCSC/JLCPCB part']), 'Invalid LCSC code')
        for name in names:
            require(name in fitted, f'BOM part has no fitted placement: {name}')
            part, _ = fitted[name]
            require(part['manufacturer_part_number'] == row['Manufacturer part number'], f'MPN mismatch: {name}')
            require(part.get('supplier_part_numbers', {}).get('jlcpcb') == [row['LCSC/JLCPCB part']], f'LCSC mismatch: {name}')
        refs.update(names)
        bom.append({'Comment': row['Function'], 'Designator': ','.join(names),
                    'Footprint': row['Package'], 'Quantity': len(names),
                    'Manufacturer Part Number': row['Manufacturer part number'],
                    'LCSC Part #': row['LCSC/JLCPCB part']})
    require(refs == set(fitted), f'BOM/CPL population differs: {refs.symmetric_difference(fitted)}')
    cpl, review = [], []
    for name in sorted(fitted, key=natural):
        part, pcb = fitted[name]
        x, y, rotation = pcb['center']['x'], pcb['center']['y'], pcb.get('rotation', 0)
        require(all(math.isfinite(v) for v in (x, y, rotation)), f'Invalid placement: {name}')
        require(pcb['layer'] in ('top', 'bottom'), f'Invalid assembly side: {name}')
        cpl.append({'Designator': name, 'Mid X': f'{x:.6f}', 'Mid Y': f'{y:.6f}',
                    'Layer': pcb['layer'].capitalize(), 'Rotation': f'{rotation % 360:.6f}'})
        review.append({'Designator': name, 'Manufacturer Part Number': part['manufacturer_part_number'],
                       'LCSC Part #': part['supplier_part_numbers']['jlcpcb'][0],
                       'Mid X': f'{x:.6f}', 'Mid Y': f'{y:.6f}', 'Rotation': f'{rotation % 360:.6f}',
                       'Review': 'Verify supplier pin 1, centroid and rotation in assembly preview'})
    return {'BOM.csv': csv_bytes(list(bom[0]), bom), 'CPL.csv': csv_bytes(list(cpl[0]), cpl),
            'placement-review.csv': csv_bytes(list(review[0]), review)}, len(fitted), len(bom)


def parse_drills(text):
    """Read the exporter's decimal metric Excellon, including G85 slots."""
    require('METRIC' in text and 'G90' in text, 'Expected absolute metric drill coordinates')
    tools, active, holes = {}, None, []
    for line in text.splitlines():
        line = line.strip()
        if match := re.fullmatch(r'T(\d+)C([\d.]+)', line):
            tools[match[1]] = float(match[2])
        elif match := re.fullmatch(r'T(\d+)', line):
            require(match[1] in tools, 'Undefined drill tool')
            active = tools[match[1]]
        elif match := re.fullmatch(r'X(-?[\d.]+)Y(-?[\d.]+)', line):
            require(active is not None, 'Drill hit without tool')
            holes.append(('round', active, float(match[1]), float(match[2])))
        elif match := re.fullmatch(r'G85X(-?[\d.]+)Y(-?[\d.]+)', line):
            require(holes and holes[-1][0] == 'round', 'Slot without start coordinate')
            start = holes.pop()
            holes.append(('slot', start[1], start[2], start[3], float(match[1]), float(match[2])))
        elif line and not (line.startswith(';') or line in ('M48', 'FMAT,2', 'METRIC', '%', 'G90', 'G05', 'M30')):
            raise ValueError(f'Unexpected drill command: {line}')
    require(len(holes) == len(set(holes)), 'Duplicate exported drill hits')
    return holes


def expected_holes(circuit, plated):
    holes = []
    kinds = ('pcb_via', 'pcb_plated_hole') if plated else ('pcb_hole',)
    for e in [e for e in circuit if e['type'] in kinds]:
        if plated:
            require(set(e['layers']) == LAYERS, 'Unexpected blind/buried drill in source')
        shape = e.get('shape', e.get('hole_shape', 'circle'))
        if shape == 'circle':
            holes.append(('round', e['hole_diameter'], e['x'], e['y']))
        elif shape == 'pill':
            w, h = e['hole_width'], e['hole_height']
            dx, dy = max(0, w-h)/2, max(0, h-w)/2
            angle = math.radians(e.get('ccw_rotation', 0))
            rx, ry = dx*math.cos(angle)-dy*math.sin(angle), dx*math.sin(angle)+dy*math.cos(angle)
            holes.append(('slot', min(w, h), e['x']-rx, e['y']-ry, e['x']+rx, e['y']+ry))
        else:
            raise ValueError(f'Unsupported source drill shape: {shape}')
    return holes


def same_hole(a, b):
    if a[0] != b[0] or abs(a[1]-b[1]) > 0.000002:
        return False
    # G85 endpoints have three decimal places in exporter 0.0.104.
    close = lambda p, q: all(abs(x-y) <= 0.0006 for x, y in zip(p, q))
    return close(a[2:], b[2:]) or (a[0] == 'slot' and close(a[2:], b[4:6]+b[2:4]))


def audit_drills(circuit, files):
    actual_names = {n for n in files if n.endswith('.drl')}
    require(actual_names == DRILLS, f'Unexpected drill files: {actual_names}')
    report, plotted = {}, []
    for name, plated in [('drill-L1-L4.drl', True), ('drill_npth.drl', False)]:
        text = files[name].decode()
        function = 'Plated,1,4,PTH' if plated else 'NonPlated,1,4,NPTH'
        require('TF.FileFunction,' + function in text, f'Incorrect physical span: {name}')
        actual, expected = parse_drills(text), expected_holes(circuit, plated)
        require(len(actual) == len(expected), f'Drill count mismatch: {name}')
        unmatched = list(actual)
        for hole in expected:
            idx = next((i for i, other in enumerate(unmatched) if same_hole(hole, other)), None)
            require(idx is not None, f'Missing/wrong drill geometry in {name}: {hole}')
            unmatched.pop(idx)
        report[name] = {'round_holes': sum(h[0] == 'round' for h in actual),
                        'slots': sum(h[0] == 'slot' for h in actual), 'geometry_matches_source': True}
        plotted.extend((plated, hole) for hole in actual)
    return report, plotted


def drill_map(board, holes):
    outline = board['outline']
    minx, maxx = min(p['x'] for p in outline), max(p['x'] for p in outline)
    miny, maxy = min(p['y'] for p in outline), max(p['y'] for p in outline)
    scale = 900 / (maxx-minx)
    x = lambda v: 50+(v-minx)*scale
    y = lambda v: 65+(maxy-v)*scale
    bottom = y(miny)+35
    svg = [f'<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="{bottom+170:.1f}" viewBox="0 0 1000 {bottom+170:.1f}">',
           '<rect width="100%" height="100%" fill="white"/>',
           '<text x="50" y="30" font-family="sans-serif" font-size="20">Bluetooth pedometer — drill map (top view, mm)</text>',
           '<polygon points="'+' '.join(f'{x(p["x"]):.3f},{y(p["y"]):.3f}' for p in outline)+'" fill="#f4f6f8" stroke="#263747" stroke-width="1.5"/>']
    for plated, h in holes:
        color = '#1264a3' if plated else '#c44816'
        if h[0] == 'round':
            svg.append(f'<circle cx="{x(h[2]):.3f}" cy="{y(h[3]):.3f}" r="{h[1]*scale/2:.3f}" fill="none" stroke="{color}" stroke-width="0.8"/>')
        else:
            svg.append(f'<line x1="{x(h[2]):.3f}" y1="{y(h[3]):.3f}" x2="{x(h[4]):.3f}" y2="{y(h[5]):.3f}" stroke="{color}" stroke-width="{h[1]*scale:.3f}" stroke-linecap="round"/>')
    counts = collections.Counter(('PTH' if plated else 'NPTH', h[0], round(h[1], 3)) for plated, h in holes)
    svg.append(f'<text x="50" y="{bottom:.1f}" font-family="sans-serif" font-size="16">Blue: plated L1–L4. Orange: non-plated. Slots show cutter diameter.</text>')
    for i, ((kind, shape, diameter), count) in enumerate(sorted(counts.items())):
        svg.append(f'<text x="{50+(i%2)*450}" y="{bottom+28+(i//2)*25:.1f}" font-family="monospace" font-size="15">{kind} {shape}: Ø{diameter:.3f} mm × {count}</text>')
    return ('\n'.join(svg)+'\n</svg>\n').encode()


def pinmap(circuit):
    parent = {}
    def find(key):
        parent.setdefault(key, key)
        if parent[key] != key:
            parent[key] = find(parent[key])
        return parent[key]
    def join(ids):
        for key in ids[1:]:
            parent[find(key)] = find(ids[0])
    source = {e['source_component_id']: e for e in circuit if e['type'] == 'source_component'}
    for e in circuit:
        if e['type'] == 'source_trace':
            join(e['connected_source_port_ids']+e['connected_source_net_ids'])
        elif e['type'] == 'source_component_internal_connection':
            join(e['source_port_ids'])
        elif e['type'] == 'source_component':
            for group in e.get('internally_connected_source_port_ids', []):
                join(group)
    nets = collections.defaultdict(set)
    for e in circuit:
        if e['type'] == 'source_net':
            nets[find(e['source_net_id'])].add(e['name'])
    ports = {e['source_port_id']: e for e in circuit if e['type'] == 'pcb_port'}
    rows = []
    for e in circuit:
        if e['type'] != 'source_port' or e['source_component_id'] not in source:
            continue
        pcb = ports.get(e['source_port_id'], {})
        rows.append({'Reference': source[e['source_component_id']]['name'], 'Pin': e.get('pin_number', ''),
                     'Pin name': e['name'], 'Net': ' / '.join(sorted(nets[find(e['source_port_id'])])) or 'NC',
                     'PCB X (mm)': pcb.get('x', ''), 'PCB Y (mm)': pcb.get('y', '')})
    rows.sort(key=lambda r: (natural(r['Reference']), str(r['Pin'])))
    return csv_bytes(list(rows[0]), rows), len(rows)


def zip_bytes(files):
    data = io.BytesIO()
    with zipfile.ZipFile(data, 'w', zipfile.ZIP_DEFLATED) as archive:
        for name, contents in sorted(files.items()):
            info = zipfile.ZipInfo(name, (1980, 1, 1, 0, 0, 0))
            info.compress_type = zipfile.ZIP_DEFLATED
            archive.writestr(info, contents)
    return data.getvalue()


def create(stage):
    circuit_data = (stage / 'circuit.json').read_bytes()
    circuit = json.loads(circuit_data)
    build = json.loads((stage / 'build-info.json').read_text())
    require(sha(circuit_data) == build['circuit_sha256'], 'Build artifact hash mismatch')
    require(not any('error' in e['type'] for e in circuit), 'Circuit contains errors')
    boards = [e for e in circuit if e['type'] == 'pcb_board']
    require(len(boards) == 1 and boards[0]['num_layers'] == 4, 'Expected one four-layer board')
    board = boards[0]
    files = {p.name: p.read_bytes() for p in (stage / 'gerbers').iterdir()}
    require(set(files) == GERBERS | DRILLS | {'F_Fab.gbr'}, 'Unexpected/missing fabrication layers')
    for name in GERBERS:
        require(b'%MOMM*%' in files[name] and files[name].rstrip().endswith(b'M02*'), f'Invalid metric Gerber: {name}')
    for name, function in [('F_Cu.gbr', 'Copper,L1,Top'), ('In1_Cu.gbr', 'Copper,L2,Inr'),
                            ('In2_Cu.gbr', 'Copper,L3,Inr'), ('B_Cu.gbr', 'Copper,L4,Bot')]:
        require(('TF.FileFunction,'+function).encode() in files[name], f'Wrong copper layer: {name}')
    drills, holes = audit_drills(circuit, files)
    outputs, count, rows = assembly_files(circuit)
    outputs['PINMAP.csv'], pin_count = pinmap(circuit)
    outputs['Gerbers.zip'] = zip_bytes({n: files[n] for n in GERBERS | DRILLS})
    outputs['F_Fab.gbr'] = files['F_Fab.gbr']
    outputs['drill-map.svg'] = drill_map(board, holes)
    for name in ['assembly.svg', 'schematic.svg', 'pcb.svg']:
        outputs[name] = (stage / name).read_bytes()
    report = {**build['checks'], 'export_drills': drills, 'fitted_parts': count,
              'bom_rows': rows, 'pinmap_rows': pin_count, 'bom_cpl_match': True,
              'source_circuit_sha256': build['circuit_sha256'], 'export_circuit_unchanged': True,
              'vias': sum(e['type'] == 'pcb_via' for e in circuit),
              'trace_paths': sum(e['type'] == 'pcb_trace' for e in circuit),
              'minimum_trace_width_mm': min(p['width'] for e in circuit if e['type'] == 'pcb_trace' for p in e['route'] if p['route_type'] == 'wire'),
              'warnings': dict(collections.Counter(e['type'] for e in circuit if 'warning' in e['type'])),
              'supplier_placement_review_required': sorted([r['Designator'] for r in csv.DictReader(io.StringIO(outputs['CPL.csv'].decode()))], key=natural),
              'limits': ['Gerber geometry export is checked; exported-copper CAM clearance review remains pending.',
                         'CPL uses source footprint centres/rotations; supplier placement calibration is not certified.',
                         'Read PACKAGE_AUDIT.md for unresolved land/model differences and assembly requirements for mask/paste/RF review.']}
    outputs['validation.json'] = (json.dumps(report, indent=2)+'\n').encode()
    for guide in GUIDES:
        outputs[guide] = (OUT / guide).read_bytes()
    inputs = build['source_files']
    for name in ROOT_DOCS:
        inputs[name] = sha((ROOT / name).read_bytes())
    for name, digest in inputs.items():
        require(sha((ROOT / name).read_bytes()) == digest, f'Input changed: {name}')
    manifest = {'schema_version': 1, 'status': 'engineering-review', 'released_for_manufacturing': False,
                'generated_at_utc': datetime.now(timezone.utc).isoformat(), 'circuit_sha256': sha(circuit_data),
                'exporter': build['exporter'], 'coordinates': {'unit': 'mm', 'origin': 'source board centre', 'flip_y_axis': False, 'rotation': 'counterclockwise degrees; supplier calibration pending'},
                'board': {k: board[k] for k in ['width', 'height', 'thickness', 'num_layers', 'material']},
                'source_files': inputs, 'files': {n: sha(b) for n, b in sorted(outputs.items())},
                'required_review': ['Footprints/models in PACKAGE_AUDIT.md', 'Supplier placement orientation/centroids',
                                    'Factory CAM clearances, mask/paste, stencil and panel', 'Actual RF stackup and impedance']}
    outputs['manifest.json'] = (json.dumps(manifest, indent=2)+'\n').encode()
    bundle = {'fabrication/'+n: b for n, b in outputs.items()}
    bundle.update({n: (ROOT/n).read_bytes() for n in ROOT_DOCS})
    bundle['review/circuit.json'] = circuit_data
    outputs['bluetooth-pedometer-cam-review.zip'] = zip_bytes(bundle)
    # Prepare and validate all bytes first. Preserve the previous package if a check fails.
    OUT.mkdir(exist_ok=True)
    for name, contents in outputs.items():
        if name not in GUIDES:
            temp = OUT / (name+'.tmp')
            temp.write_bytes(contents)
            temp.replace(OUT / name)
    print(f'Created fabrication/: {count} fitted parts, {rows} BOM rows, {len(GERBERS)} Gerber layers, {len(DRILLS)} drill files. Engineering review only.')


def check():
    manifest = json.loads((OUT / 'manifest.json').read_text())
    require(manifest['status'] == 'engineering-review' and manifest['released_for_manufacturing'] is False, 'Unexpected release status')
    current_sources = {str(p.relative_to(ROOT)) for directory in ['imports', 'scripts']
                       for p in (ROOT/directory).rglob('*') if p.suffix in ('.ts', '.tsx', '.mjs', '.py')}
    recorded_sources = {n for n in manifest['source_files'] if n.startswith(('imports/', 'scripts/'))}
    require(current_sources == recorded_sources, 'Source file inventory changed; run bun run export:fabrication')
    for name, digest in manifest['source_files'].items():
        require((ROOT/name).is_file() and sha((ROOT/name).read_bytes()) == digest, f'Stale source: {name}; run bun run export:fabrication')
    for name, digest in manifest['files'].items():
        require((OUT/name).is_file() and sha((OUT/name).read_bytes()) == digest, f'Missing/modified fabrication file: {name}')
    with zipfile.ZipFile(OUT/'Gerbers.zip') as archive:
        require(archive.testzip() is None and set(archive.namelist()) == GERBERS | DRILLS, 'Invalid Gerber archive')
    with zipfile.ZipFile(OUT/'bluetooth-pedometer-cam-review.zip') as archive:
        require(archive.testzip() is None, 'Corrupt CAM archive')
        for name in [*manifest['files'], 'manifest.json']:
            require(archive.read('fabrication/'+name) == (OUT/name).read_bytes(), f'CAM bundle differs: {name}')
        require(sha(archive.read('review/circuit.json')) == manifest['circuit_sha256'], 'CAM circuit mismatch')
        for name in ROOT_DOCS:
            require(sha(archive.read(name)) == manifest['source_files'][name], f'CAM document mismatch: {name}')
    print('Fabrication package consistency: PASS. Factory/placement review remains pending; not released for ordering.')


if __name__ == '__main__':
    try:
        require(len(sys.argv) >= 2 and sys.argv[1] in ('create', 'check'), 'Usage: package-fabrication.py create STAGE | check')
        if sys.argv[1] == 'create':
            create(Path(sys.argv[2]))
        else:
            check()
    except (ValueError, KeyError, OSError, zipfile.BadZipFile) as error:
        print(f'Fabrication validation failed: {error}', file=sys.stderr)
        sys.exit(1)
