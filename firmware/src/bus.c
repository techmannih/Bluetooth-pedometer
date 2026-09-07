#include "bus.h"
#include <errno.h>
int reg_read8(const struct reg_bus *b, uint8_t a, uint8_t r, uint8_t *v)
{ return b->read(b->ctx, a, r, v, 1); }
int reg_write8(const struct reg_bus *b, uint8_t a, uint8_t r, uint8_t v)
{ return b->write(b->ctx, a, r, &v, 1); }
int reg_write_checked(const struct reg_bus *b, uint8_t a, uint8_t r, uint8_t v)
{
    uint8_t actual;
    int rc = reg_write8(b, a, r, v);
    if (rc) { return rc; }
    rc = reg_read8(b, a, r, &actual);
    return rc ? rc : actual == v ? 0 : -EIO;
}
