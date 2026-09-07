#!/usr/bin/env python3
"""Install pinned TI build dependencies locally. Does not flash or edit vendors."""
from pathlib import Path
import hashlib
import json
import os
import platform
import subprocess
import sys
import tarfile
import urllib.request
import venv

root = Path(__file__).resolve().parent
deps = root / ".deps"
config = json.loads((root / "dependencies.json").read_text())
deps.mkdir(exist_ok=True)
python = root / ".venv/bin/python"
if not python.exists():
    venv.EnvBuilder(with_pip=True).create(root / ".venv")


def run(*args, cwd=root, env=None):
    subprocess.run([str(a) for a in args], cwd=cwd, env=env, check=True)


run(python, "-m", "pip", "install", "-r", root / "requirements.txt")
z = deps / "zephyr"
revision = config["zephyr"]["revision"]
if not (z / ".git").exists():
    run("git", "init", z)
    run("git", "-C", z, "remote", "add", "origin", config["zephyr"]["url"])
    run("git", "-C", z, "fetch", "--depth", "1", "origin", revision)
    run("git", "-C", z, "checkout", "--detach", "FETCH_HEAD")
actual = subprocess.check_output(["git", "-C", str(z), "rev-parse", "HEAD"], text=True).strip()
if actual != revision:
    sys.exit("Existing .deps/zephyr differs from pinned revision; use a separate dependency directory.")
environment = dict(os.environ, PATH=str(python.parent) + os.pathsep + os.environ.get("PATH", ""), ZEPHYR_BASE=str(z))
west = python.parent / "west"
if not (deps / ".west").exists():
    run(west, "init", "-l", "zephyr", cwd=deps, env=environment)
run(west, "update", "--narrow", "-o=--depth=1", *config["zephyr"]["modules"], cwd=deps, env=environment)
run(python, "-m", "pip", "install", "-r", z / "scripts/requirements-base.txt")

system = {"Darwin": "macos", "Linux": "linux"}.get(platform.system())
machine = {"arm64": "aarch64", "aarch64": "aarch64", "x86_64": "x86_64"}.get(platform.machine())
if not system or not machine:
    sys.exit("Automatic SDK setup supports macOS/Linux on arm64/x86_64; see README for manual setup.")
version = config["sdk_version"]
sdk = deps / ("zephyr-sdk-" + version)
compiler = sdk / "arm-zephyr-eabi/bin/arm-zephyr-eabi-gcc"
if not compiler.exists():
    downloads = deps / "downloads"
    downloads.mkdir(exist_ok=True)
    base = "https://github.com/zephyrproject-rtos/sdk-ng/releases/download/v" + version + "/"
    checksum_text = urllib.request.urlopen(base + "sha256.sum", timeout=60).read().decode()
    checksums = {line.split()[1].lstrip("*"): line.split()[0] for line in checksum_text.splitlines()}
    names = [f"zephyr-sdk-{version}_{system}-{machine}_minimal.tar.xz",
             f"toolchain_{system}-{machine}_arm-zephyr-eabi.tar.xz"]
    for index, name in enumerate(names):
        archive = downloads / name
        if not archive.exists():
            print("Downloading", name, flush=True)
            with urllib.request.urlopen(base + name, timeout=60) as src, archive.open("wb") as dst:
                while True:
                    chunk = src.read(1024 * 1024)
                    if not chunk:
                        break
                    dst.write(chunk)
        if hashlib.sha256(archive.read_bytes()).hexdigest() != checksums[name]:
            sys.exit("SDK checksum mismatch: " + str(archive))
        target = deps if index == 0 else sdk
        # Archives are verified against the official release before extraction.
        with tarfile.open(archive) as source:
            for item in source.getmembers():
                dest = (target / item.name).resolve()
                if dest != target.resolve() and target.resolve() not in dest.parents:
                    sys.exit("Unexpected archive member: " + item.name)
            source.extractall(target)
# Explicit ZEPHYR_SDK_INSTALL_DIR avoids global SDK/CMake registration.
run(compiler, "--version")
print("Ready. Build: python3 firmware/build.py")
