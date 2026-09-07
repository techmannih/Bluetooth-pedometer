cmake_minimum_required(VERSION 3.20.0)
find_package(Zephyr REQUIRED HINTS $ENV{ZEPHYR_BASE})
project(bluetooth_pedometer C)
target_sources(app PRIVATE src/main.c src/core.c src/bus.c src/pmic.c
  src/gauge.c src/motion.c src/oled.c src/platform.c src/ble.c src/storage.c
  vendor/bma400/bma400.c)
target_include_directories(app PRIVATE src vendor/bma400)
target_compile_options(app PRIVATE -Wall -Wextra)
