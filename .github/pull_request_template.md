## What

<!-- Brief description of the change. -->

## Why

<!-- Why this change is needed. What problem does it solve? -->

## Area

- [ ] backend
- [ ] web
- [ ] firmware
- [ ] docs / protocol
- [ ] docker / infrastructure

## Checklist

- [ ] Relevant docs updated in this PR
- [ ] Typecheck and build pass locally (`npm run check && npm run build`)
- [ ] Scaffold vs. implemented status remains honest
- [ ] No secrets, credentials, or unsafe defaults introduced
- [ ] Contract-facing changes (API routes, MQTT topics, payload shapes) involve protocol/docs ownership
- [ ] Firmware changes verified with `idf.py build` for `esp32c3` (if firmware touched)
