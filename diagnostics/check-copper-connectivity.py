"""Independent geometric copper-continuity audit; never edits circuit JSON."""
import collections
import json
import sys
from shapely.geometry import Point, LineString, Polygon, box
from shapely.affinity import rotate
from shapely.strtree import STRtree
from shapely.ops import unary_union, nearest_points

A = json.load(open(sys.argv[1]))
LAYERS = ['top', 'inner1', 'inner2', 'bottom']
EPS = 0.000001  # 1 nm numerical join tolerance, far below the design clearances.

class UnionFind:
    def __init__(self): self.p = {}
    def find(self, x):
        self.p.setdefault(x, x)
        if self.p[x] != x: self.p[x] = self.find(self.p[x])
        return self.p[x]
    def join(self, *xs):
        if xs:
            root = self.find(xs[0])
            for x in xs[1:]: self.p[self.find(x)] = root

logical, copper = UnionFind(), UnionFind()
sc = {x['source_component_id']: x for x in A if x['type'] == 'source_component'}
sp = {x['source_port_id']: x for x in A if x['type'] == 'source_port'}
ports = {x['pcb_port_id']: x for x in A if x['type'] == 'pcb_port'}
source_to_pcb = {x['source_port_id']: x['pcb_port_id'] for x in ports.values()}
for x in A:
    if x['type'] == 'source_trace':
        logical.join(*(x['connected_source_port_ids'] + x['connected_source_net_ids']))
for c in sc.values():
    for group in c.get('internally_connected_source_port_ids', []): logical.join(*group)

by_layer = collections.defaultdict(list)
pad_nodes = collections.defaultdict(list)
def add(geom, layer, pad=None):
    if geom.is_empty: raise ValueError('Empty copper primitive')
    if not geom.is_valid: raise ValueError('Invalid copper polygon')
    i = len(copper.p)
    copper.find(i)
    by_layer[layer].append((i, geom.buffer(EPS)))
    if pad: pad_nodes[pad].append(i)
    return i

def primitive(x):
    shape = x.get('shape', 'circle')
    if shape == 'polygon': return Polygon([(p['x'], p['y']) for p in x['points']])
    px, py = x['x'], x['y']
    if shape == 'circle':
        r = x.get('radius', x.get('outer_diameter', 0) / 2)
        return Point(px, py).buffer(r, resolution=64)
    if shape == 'rect':
        g = box(px-x['width']/2, py-x['height']/2, px+x['width']/2, py+x['height']/2)
    elif shape == 'pill':
        w, h = x['outer_width'], x['outer_height']; r = min(w, h)/2
        dx, dy = max(0, w-h)/2, max(0, h-w)/2
        g = LineString([(px-dx, py-dy), (px+dx, py+dy)]).buffer(r, resolution=64)
    else: raise ValueError('Unsupported pad shape: '+shape)
    return rotate(g, x.get('ccw_rotation', 0), origin=(px, py))

for x in A:
    kind = x['type']
    if kind == 'pcb_smtpad':
        add(primitive(x), x['layer'], x.get('pcb_port_id'))
    elif kind in ['pcb_via', 'pcb_plated_hole']:
        # A filled annulus envelope is sufficient for continuity: the plated
        # barrel joins its full perimeter and all listed copper layers.
        ids = [add(primitive(x), layer, x.get('pcb_port_id')) for layer in x['layers']]
        copper.join(*ids)
    elif kind == 'pcb_trace':
        route = x['route']
        for p, q in zip(route, route[1:]):
            if p['route_type'] == q['route_type'] == 'wire' and p['layer'] == q['layer']:
                line = LineString([(p['x'], p['y']), (q['x'], q['y'])])
                g = line.buffer(min(p['width'], q['width'])/2, resolution=32)
                if not g.is_empty: add(g, p['layer'])
        # through_pad changes layer within an existing plated pad; its copper
        # and barrel were already added from pcb_via/pcb_plated_hole.
        assert all(p['route_type'] in ['wire', 'via', 'through_pad'] for p in route), 'Unsupported route primitive'
    elif kind == 'pcb_copper_pour':
        assert x['shape'] == 'brep'
        b = x['brep_shape']; ring = lambda r: [(p['x'], p['y']) for p in r['vertices']]
        add(Polygon(ring(b['outer_ring']), [ring(r) for r in b['inner_rings']]), x['layer'])

for layer, items in by_layer.items():
    geoms = [g for _, g in items]; tree = STRtree(geoms)
    for j, (node, geom) in enumerate(items):
        for k in tree.query(geom, predicate='intersects'):
            if k > j: copper.join(node, items[k][0])

# Only permanently joined component contacts, such as the two legs of one
# push-button terminal, can bridge copper islands through the component.
for c in sc.values():
    for group in c.get('internally_connected_source_port_ids', []):
        copper.join(*(i for p in group for i in pad_nodes.get(source_to_pcb.get(p), [])))

net_names = collections.defaultdict(list)
for x in A:
    if x['type'] == 'source_net': net_names[logical.find(x['source_net_id'])].append(x['name'])
targets = collections.defaultdict(list)
for pid, p in ports.items():
    source = sp[p['source_port_id']]; component = sc.get(source['source_component_id'], {})
    net = logical.find(p['source_port_id'])
    if not component.get('supplier_part_numbers') or net not in net_names: continue
    ids = pad_nodes.get(pid)
    if not ids: raise ValueError('Missing physical pad for '+component['name']+'.'+source.get('name',pid))
    islands = {copper.find(i) for i in ids}
    assert len(islands) == 1, ('One pad has disconnected pieces', pid)
    label = component['name']+'.'+source.get('name', str(source.get('pin_number')))
    targets[net].append((label, next(iter(islands))))

opens = []
island_nets = collections.defaultdict(set)
for net, members in targets.items():
    groups = collections.defaultdict(list)
    for label, island in members:
        groups[island].append(label); island_nets[island].add(net)
    if len(groups) != 1:
        nearest = None
        roots = list(groups)
        for a, root_a in enumerate(roots):
            for root_b in roots[a+1:]:
                for layer, items in by_layer.items():
                    ga = [g for i,g in items if copper.find(i)==root_a]
                    gb = [g for i,g in items if copper.find(i)==root_b]
                    if not ga or not gb: continue
                    pa,pb = nearest_points(unary_union(ga),unary_union(gb))
                    gap = pa.distance(pb)
                    if nearest is None or gap<nearest['gap_mm']:
                        nearest={'layer':layer,'gap_mm':gap,'a':[pa.x,pa.y],'b':[pb.x,pb.y]}
        opens.append({'net':net_names[net], 'islands':list(groups.values()),'nearest_gap':nearest})
shorts = [sorted(name for net in nets for name in net_names[net]) for nets in island_nets.values() if len(nets)>1]
print(json.dumps({'named_connected_pins':sum(map(len,targets.values())), 'nets':len(targets),
    'open_nets':opens, 'shorted_net_groups':shorts}, indent=2))
sys.exit(1 if opens or shorts else 0)
