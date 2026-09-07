#!/usr/bin/env python3
"""Build only. Use --conf for reviewed hardware options; no automatic flashing."""
from pathlib import Path
import argparse
import os
import subprocess
import sys

root = Path(__file__).resolve().parent
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument("--conf", type=Path, help="Additional Kconfig file (e.g. OLED32 or verified battery)")
parser.add_argument("--build-dir", type=Path, default=root / "build")
parser.add_argument("--pristine", action="store_true")
args = parser.parse_args()
tools = root / ".venv/bin"
if not (tools / "west").exists():
    sys.exit("Run python3 firmware/setup.py first.")
env = dict(os.environ, PATH=str(tools) + os.pathsep + os.environ.get("PATH", ""),
           ZEPHYR_BASE=str(root / ".deps/zephyr"),
           ZEPHYR_SDK_INSTALL_DIR=str(root / ".deps/zephyr-sdk-0.16.8"))
cmd = [str(tools / "west"), "build", "-b", "lp_em_cc2340r53", "-d", str(args.build_dir.resolve())]
if args.pristine:
    cmd += ["-p", "always"]
cmd += [str(root), "--", "-DEXTRA_CONF_FILE=" + (str(args.conf.resolve()) if args.conf else "")]
subprocess.run(cmd, cwd=root / ".deps", env=env, check=True)
print("HEX:", args.build_dir.resolve() / "zephyr/zephyr.hex")
