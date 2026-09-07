#!/usr/bin/env python3
"""Run portable production drivers and state logic with ASan/UBSan and fake buses."""
from pathlib import Path
import os
import shlex
import subprocess
import tempfile

root = Path(__file__).resolve().parents[1]
sources = ["tests/test_firmware.c", "src/core.c", "src/bus.c", "src/pmic.c",
           "src/gauge.c", "src/motion.c", "src/oled.c", "vendor/bma400/bma400.c"]
with tempfile.TemporaryDirectory(prefix="pedometer-tests-") as directory:
    binary = Path(directory) / "tests"
    command = shlex.split(os.environ.get("CC", "clang")) + [
        "-std=c11", "-g", "-Wall", "-Wextra", "-Werror",
        "-fsanitize=address,undefined", "-fno-omit-frame-pointer",
        "-Isrc", "-Ivendor/bma400", *sources, "-o", str(binary)]
    subprocess.run(command, cwd=root, check=True)
    subprocess.run([str(binary)], check=True)
