#ifndef PEDOMETER_STORAGE_H
#define PEDOMETER_STORAGE_H
#include <stdint.h>
void storage_restore(uint32_t *steps, uint16_t *stride);
int storage_checkpoint(uint32_t steps, uint16_t stride);
#endif
