# Firmware TODO

This list tracks the remaining firmware work. Items are grouped by priority and should stay explicit so the scaffold does not quietly drift into production assumptions.

## P0 - Security And Boot

- [ ] Implement persistent secure provisioning instead of relying on default runtime placeholders.
- [ ] Add a clear provisioning state machine: unprovisioned, provisioning, provisioned, revoked, error.
- [ ] Replace placeholder broker fingerprints and token values with backend-issued secrets.
- [ ] Add credential rotation support.
- [ ] Decide and document the final certificate trust strategy for field devices.
- [ ] Keep insecure development overrides compile-time only and off by default.

## P0 - Connectivity

- [ ] Implement the actual MQTT client transport.
- [ ] Add reconnect handling with backoff and offline detection.
- [ ] Define and implement publish/subscribe topic contracts for telemetry, commands, acknowledgements, and health.
- [ ] Add command deduplication and idempotency handling.
- [ ] Add command timeout and retry semantics.

## P0 - OTA

- [ ] Implement OTA artifact retrieval.
- [ ] Add artifact authenticity verification.
- [ ] Add rollback-safe update flow.
- [ ] Report OTA progress and failure reasons back to the backend.
- [ ] Add recovery behavior for interrupted updates.

## P1 - Hardware Abstraction

- [ ] Freeze the real ESP32-C3 SuperMini board revision used for production.
- [ ] Validate the production GPIO map against that exact board revision.
- [ ] Move all board-specific pin definitions into one board-map module.
- [ ] Separate Wokwi-only GPIO assignments from production assignments.
- [ ] Review strapping pins and boot-sensitive pins before connecting sensors or actuators.

## P1 - Sensors

- [ ] Implement real soil moisture sensing.
- [ ] Implement real air humidity sensing.
- [ ] Implement real air temperature sensing.
- [ ] Add optional tank level sensing.
- [ ] Add raw, calibrated, and exposed values as separate data paths.
- [ ] Add per-channel calibration storage.
- [ ] Add sensor fault classification and reporting.

## P1 - Pump Control

- [ ] Implement peristaltic pump GPIO control.
- [ ] Add runtime limit enforcement.
- [ ] Add manual watering command execution.
- [ ] Add flow or current feedback if hardware supports it.
- [ ] Add tank-empty interlock behavior.
- [ ] Add safety shutoff on fault or stale command state.

## P1 - Observability

- [ ] Expand diagnostics beyond boot reset context.
- [ ] Add structured device logs for comms, sensor, and actuator events.
- [ ] Publish health summaries to the backend.
- [ ] Add telemetry rate limiting or batching if needed.

## P2 - Testing

- [ ] Add unit tests for configuration validation.
- [ ] Add unit tests for protocol topic generation.
- [ ] Add unit tests for device state transitions.
- [ ] Add integration tests for boot-to-comm start behavior.
- [ ] Add hardware-in-the-loop coverage for ESP32-C3.
- [ ] Add Wokwi smoke tests for the demo wiring.

## P2 - Documentation

- [ ] Keep `firmware/README.md` as the entrypoint and update it whenever the boot flow changes.
- [ ] Keep `firmware/ARCHITECTURE.md` synchronized with module boundaries.
- [ ] Update this TODO file whenever a task moves from scaffold to implemented.
- [ ] Add a pinout reference once the physical SuperMini revision is frozen.

## Already Verified

- [x] ESP32-C3 target alignment is in place.
- [x] The firmware builds successfully for `ESP32-C3`.
- [x] NVS initialization is wired into boot.
- [x] Security validation blocks comms when credentials are insecure or placeholders.
- [x] Wokwi scaffold exists for boot and demo wiring.
