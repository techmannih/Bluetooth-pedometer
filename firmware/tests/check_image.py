#!/usr/bin/env python3
"""Check target memory layout, linked application, HEX/ELF content and board pins."""
from pathlib import Path
import argparse
import hashlib
import struct
import sys
from elftools.elf.elffile import ELFFile
from intelhex import IntelHex

root = Path(__file__).resolve().parents[1]
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument("--build-dir", type=Path, default=root / "build")
args = parser.parse_args()
build = args.build_dir.resolve()
sys.path.insert(0, str(root / ".deps/zephyr/scripts/dts/python-devicetree/src"))
from devicetree.dtlib import DT

tree = DT(str(build / "zephyr/zephyr.dts"))
nodes = tree.label2node
assert tree.root.props["model"].to_string() == "Bluetooth Pedometer R4"
assert nodes["slot0_partition"].props["reg"].to_nums() == [0, 0x7c000]
assert nodes["storage_partition"].props["reg"].to_nums() == [0x7c000, 0x4000]
assert not {"boot_partition", "slot1_partition", "mx25r80", "btn0", "led0"} & nodes.keys()
for name in ("uart0", "adc0", "pwm5", "pwm6"):
    assert nodes[name].props["status"].to_string() == "disabled", name
for name in ("i2c0", "spi0", "gpio0", "wdt0", "ti_bt_hci"):
    assert nodes[name].props["status"].to_string() == "okay", name
for name, expected in (("i2c0", [[24, 5], [0, 2]]), ("spi0", [[8, 1], [19, 4], [25, 1]])):
    pins = [n.props["pinmux"].to_nums() for n in nodes[name].props["pinctrl-0"].to_nodes()]
    assert pins == expected, (name, pins)
assert "cs-gpios" not in nodes["spi0"].props
sleep = nodes["spi0"].props["pinctrl-1"].to_nodes()
assert [n.props["pinmux"].to_nums() for n in sleep] == [[8, 0], [19, 0], [25, 0]]
assert all("bias-pull-down" in n.props for n in sleep)
gpio = nodes["gpio0"]
assert gpio.nodes["charger_inhibit"].props["gpios"].to_nums() == [1, 0]
assert "output-high" in gpio.nodes["charger_inhibit"].props
assert gpio.nodes["oled_off"].props["gpios"].to_nums() == [21, 0]
assert "output-low" in gpio.nodes["oled_off"].props

hex_path = build / "zephyr/zephyr.hex"
image = IntelHex(str(hex_path))
for start, end in image.segments():
    assert (0 <= start < end <= 0x7c000) or (0x4e020000 <= start < end <= 0x4e020800)
sp, reset = struct.unpack("<II", bytes(image.tobinarray(start=0, size=8)))
assert 0x20000000 < sp <= 0x20010000 and sp % 8 == 0
assert reset & 1 and reset < 0x7c000
with (build / "zephyr/zephyr.elf").open("rb") as source:
    elf = ELFFile(source)
    assert elf["e_machine"] == "EM_ARM"
    symbols = {s.name for s in elf.get_section_by_name(".symtab").iter_symbols()}
    required = {"main", "board_init", "pmic_setup", "motion_init", "gauge_read",
                "oled_text", "ble_start", "steps_sample", "storage_checkpoint"}
    assert required <= symbols, required - symbols
    for section in elf.iter_sections():
        if not section["sh_flags"] & 2 or section["sh_type"] == "SHT_NOBITS" or not section["sh_size"]:
            continue
        segments = [s for s in elf.iter_segments() if s["p_type"] == "PT_LOAD" and s.section_in_segment(section)]
        assert len(segments) == 1, section.name
        segment = segments[0]
        address = segment["p_paddr"] + section["sh_addr"] - segment["p_vaddr"]
        actual = bytes(image.tobinarray(start=address, size=section["sh_size"]))
        assert actual == section.data(), section.name + " differs in HEX"
config = (build / "zephyr/.config").read_text()
for option in ("CONFIG_I2C_CALLBACK", "CONFIG_GPIO_HOGS", "CONFIG_PM_DEVICE",
               "CONFIG_BT_SMP_SC_ONLY", "CONFIG_BT_SMP_APP_PAIRING_ACCEPT",
               "CONFIG_BT_PRIVACY", "CONFIG_BT_SETTINGS", "CONFIG_SETTINGS_NVS"):
    assert option + "=y" in config, option
charging = "CONFIG_PEDOMETER_BATTERY_PROFILE_APPROVED=y" in config
print("PASS: active pins, charge-inhibit boot GPIO, flash/NVS bounds, ARM vectors, linked features and HEX/ELF agreement")
print("Charging profile:", "enabled (requires real pack approval)" if charging else "disabled (default)")
print("HEX SHA-256:", hashlib.sha256(hex_path.read_bytes()).hexdigest())
