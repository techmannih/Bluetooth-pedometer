"""Negative controls for manufacturing-file errors that a build cannot catch."""
import csv
import importlib.util
import io
import json
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

spec = importlib.util.spec_from_file_location('packager', Path(__file__).with_name('package-fabrication.py'))
packager = importlib.util.module_from_spec(spec)
spec.loader.exec_module(packager)


class FabricationTests(unittest.TestCase):
    def test_slot_is_one_operation_and_accepts_endpoint_rounding(self):
        holes = packager.parse_drills('M48\nMETRIC\nT10C0.8\n%\nG90\nG05\nT10\nX-22.6741Y-4.3251\nG85X-22.074Y-4.325\nM30')
        self.assertEqual(len(holes), 1)
        source = [{'type': 'pcb_plated_hole', 'layers': list(packager.LAYERS), 'shape': 'pill',
                   'hole_width': 0.8, 'hole_height': 1.4, 'x': -22.37413, 'y': -4.32511, 'ccw_rotation': 270}]
        expected = packager.expected_holes(source, True)[0]
        self.assertTrue(packager.same_hole(expected, holes[0]))
        self.assertFalse(packager.same_hole(expected, ('slot', 0.8, -22.374, -4.625, -22.374, -4.025)))

    def test_duplicate_hits_rejected(self):
        with self.assertRaisesRegex(ValueError, 'Duplicate'):
            packager.parse_drills('METRIC\nG90\nT10C0.2\nT10\nX1Y2\nX1Y2')

    def test_inch_drills_rejected(self):
        with self.assertRaisesRegex(ValueError, 'metric'):
            packager.parse_drills('INCH\nG90\nT10C0.02\nT10\nX1Y2')

    def test_y_mirror_is_not_tolerated(self):
        self.assertFalse(packager.same_hole(('round', 0.2, 2.0, 4.0), ('round', 0.2, 2.0, -4.0)))

    def test_blind_source_via_rejected(self):
        with self.assertRaisesRegex(ValueError, 'blind/buried'):
            packager.expected_holes([{'type': 'pcb_via', 'layers': ['top', 'inner1'], 'x': 0, 'y': 0, 'hole_diameter': 0.2}], True)

    def assembly_fixture(self, path):
        (path/'BOM.csv').write_text('Reference,Quantity,Manufacturer part number,LCSC/JLCPCB part,Package,Function\nR1,1,PART,C123,0402,10k\n')
        return [
            {'type': 'source_component', 'source_component_id': 's1', 'name': 'R1', 'manufacturer_part_number': 'PART', 'supplier_part_numbers': {'jlcpcb': ['C123']}},
            {'type': 'pcb_component', 'source_component_id': 's1', 'center': {'x': 1.25, 'y': -2.5}, 'layer': 'top', 'rotation': -90},
            {'type': 'source_component', 'source_component_id': 'tp', 'name': 'TP1', 'ftype': 'simple_test_point'},
            {'type': 'pcb_component', 'source_component_id': 'tp', 'center': {'x': 0, 'y': 0}, 'layer': 'top', 'rotation': 0},
            {'type': 'pcb_component', 'source_component_id': 'virtual_via', 'center': {'x': 0, 'y': 0}, 'layer': 'top'},
        ]

    def test_cpl_excludes_bare_points_and_preserves_negative_coordinate(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            circuit = self.assembly_fixture(root)
            with patch.object(packager, 'ROOT', root):
                files, count, _ = packager.assembly_files(circuit)
            cpl = list(csv.DictReader(io.StringIO(files['CPL.csv'].decode())))
            self.assertEqual(count, 1)
            self.assertEqual(cpl[0]['Designator'], 'R1')
            self.assertEqual(float(cpl[0]['Mid Y']), -2.5)
            self.assertEqual(float(cpl[0]['Rotation']), 270)

    def test_wrong_supplier_code_rejected(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            circuit = self.assembly_fixture(root)
            circuit[0]['supplier_part_numbers']['jlcpcb'] = ['C999']
            with patch.object(packager, 'ROOT', root), self.assertRaisesRegex(ValueError, 'LCSC mismatch'):
                packager.assembly_files(circuit)

    def test_missing_placement_rejected(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            circuit = self.assembly_fixture(root)
            circuit[1]['do_not_place'] = True
            with patch.object(packager, 'ROOT', root), self.assertRaisesRegex(ValueError, 'no fitted placement'):
                packager.assembly_files(circuit)

    def test_check_rejects_stale_source(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            (root/'index.circuit.tsx').write_text('changed source')
            (root/'manifest.json').write_text(json.dumps({
                'status': 'engineering-review', 'released_for_manufacturing': False,
                'source_files': {'index.circuit.tsx': packager.sha(b'previous source')}, 'files': {},
            }))
            with patch.object(packager, 'ROOT', root), patch.object(packager, 'OUT', root), self.assertRaisesRegex(ValueError, 'Stale source'):
                packager.check()

    def test_check_rejects_edited_placement_file(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            (root/'CPL.csv').write_text('edited placement')
            (root/'manifest.json').write_text(json.dumps({
                'status': 'engineering-review', 'released_for_manufacturing': False,
                'source_files': {}, 'files': {'CPL.csv': packager.sha(b'original placement')},
            }))
            with patch.object(packager, 'ROOT', root), patch.object(packager, 'OUT', root), self.assertRaisesRegex(ValueError, 'modified fabrication file'):
                packager.check()


if __name__ == '__main__':
    unittest.main()
