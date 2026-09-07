# Firmware validation — 2026-09-07

Implementation and software checks complete. No board was flashed or physically
tested during this work.

| Check | Result |
| --- | --- |
| Local dependency setup (`python3 firmware/setup.py`) | PASS on macOS arm64, Python 3.9.6 |
| Production core/driver tests (`python3 firmware/tests/run.py`) | PASS with AddressSanitizer and UndefinedBehaviorSanitizer |
| Default target build (`python3 firmware/build.py`) | PASS; charging inhibited, 128×64 OLED, non-wrist parameters |
| Alternate target build | PASS; 128×32 OLED, wrist parameters, synthetic approved battery profile at 20 mA |
| Image checks, both builds | PASS; active pins, GPIO boot inhibit, memory bounds, ARM vectors, linked application functions, HEX/ELF agreement |
| Final target compiler warnings/errors | None in either final build log |
| Dependency source status | TI Zephyr and TI HAL unchanged; Bosch sources vendored unchanged at pinned commit |

Default application: **237,816 bytes FLASH / 507,904 available** and
**40,756 bytes RAM / 65,536 available**. CCFG occupies its separate 2,048-byte
region. The alternate test build uses 238,772 bytes of application flash and
40,756 bytes of RAM. It is only a build-coverage fixture, not an approved pack
configuration for physical use.

Default HEX SHA-256:

```text
3e55881aec1f50c228d978241637f6681a1f33c32392428bfaac8f140540c7e4
```

The verified default image is `build/zephyr/zephyr.hex`. Regeneration after
source/toolchain changes requires rerunning checks; an old hash is not evidence
for a later build. The host tests exercise mocked registers and display I/O,
not the Zephyr scheduler, physical buses, RF or an analog battery model.

Hardware acceptance remains: first boot at 1.8 V and transition to 3.0 V;
correct display/cable compatibility; button and BLE passkey pairing; measured
step accuracy and range; selected pack/NTC charging limits; resets/brownouts;
power consumption. Charging stays disabled in the supplied default image until
the actual cell profile is supplied and verified.
