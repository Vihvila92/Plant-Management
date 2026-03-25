# Firmware TODO

Tracks remaining firmware work grouped by functional area. Items progress from scaffold to implemented.
Each group maps to a logical delivery unit — not all groups need to be done in order, but P0 items block everything downstream.

---

## P0 — WiFi & MQTT Transport

These are the core blocker. Without connectivity, no telemetry reaches the backend and no commands reach the node.

- [ ] Implement WiFi station mode initialization (`esp_wifi`, `esp_netif`)
- [ ] Add reconnect loop with exponential backoff
- [ ] Integrate ESP-MQTT client (`mqtt_client_handle_t`) into `pm_comm`
- [ ] Implement `pm_comm_publish_heartbeat` — real MQTT publish
- [ ] Implement `pm_comm_publish_measurement` — real MQTT publish
- [ ] Implement `pm_comm_publish_command_result` — real MQTT publish
- [ ] Subscribe to `plants/{device_id}/command` on connect
- [ ] Parse incoming water commands (`action`, `duration_ms`)
- [ ] Dispatch received commands to pump control layer
- [ ] Align topic names with spec: `plants/{id}/telemetry`, `plants/{id}/command`
- [ ] Add MQTT event handler (connected, disconnected, message received)
- [ ] Add offline message queuing or drop policy

---

## P0 — Pump Control

Core actuator — without this the system cannot water anything.

- [ ] Define pump GPIO (MOSFET gate) in config and board-map module
- [ ] Implement pump on/off via GPIO (low-side MOSFET switching)
- [ ] Add flyback diode and gate pulldown assumptions to hardware notes
- [ ] Enforce max runtime limit from config (`pump.max_run_seconds`)
- [ ] Enforce minimum cooldown between waterings
- [ ] Block watering if soil is already above wet threshold
- [ ] Block watering if tank level is LOW or CRITICAL
- [ ] Add pump state tracking (idle / running / cooldown / faulted)
- [ ] Publish pump state changes in telemetry (`pump_state`)
- [ ] Support 5V and 12V pump voltage variants via config flag

---

## P0 — Fault Detection & Local Safety

Safety must work even when the backend is unreachable.

- [ ] Integrate INA219 current sensor driver (I2C)
- [ ] Sample current while pump is running
- [ ] Detect pump-on-no-current fault (pump failure or open circuit)
- [ ] Detect current-while-pump-off fault (stuck relay or MOSFET)
- [ ] Latch fault state and block further pump operation until cleared
- [ ] Publish fault flag in telemetry (`fault`, `fault_reason`)
- [ ] Add hardware watchdog integration
- [ ] Add emergency shutoff path from any safety layer

---

## P0 — NVS Configuration Persistence

Without this, every reboot loses config and the node cannot be provisioned.

- [ ] Implement `pm_config_save` with real NVS write
- [ ] Implement `pm_config_load` with real NVS read, falling back to defaults
- [ ] Store and restore: device_id, mqtt credentials, pump params, sensor params
- [ ] Add config version field for safe migration
- [ ] Expose provisioning write path (serial or initial MQTT message)
- [ ] Support per-node `adc_pin` from config (not hardcoded GPIO0)
- [ ] Support per-node `pump.voltage` and `pump.max_run_seconds` from config
- [ ] Support `tank_id` reference per node config

---

## P1 — Tank System

Shared resource — required before multi-plant deployments.

- [ ] Define tank sensor GPIO (float switch LOW, float switch CRITICAL)
- [ ] Create `pm_tank` component with level state machine (OK / LOW / CRITICAL)
- [ ] Poll or interrupt-drive float switches
- [ ] Publish tank state to `tanks/{tank_id}/state` (`low`, `critical`)
- [ ] Subscribe plant nodes to relevant tank state topic
- [ ] Block all pump operations on CRITICAL tank level immediately
- [ ] Suppress new watering commands on LOW tank level
- [ ] Support dedicated tank-node mode (one node reads tank, publishes state)
- [ ] Support combined mode (plant node also reads tank sensors)

---

## P1 — Sensor Layer

Hardened sensor implementation for production hardware.

- [ ] Freeze production GPIO assignments for ESP32-C3 SuperMini
- [ ] Replace DHT22 (air sensor) with production driver if hardware changes
- [ ] Implement capacitive soil moisture sensor on configurable ADC pin
- [ ] Add ADC calibration: raw → moisture percentage mapping
- [ ] Add per-channel calibration storage in NVS
- [ ] Add sensor fault classification (out-of-range, timeout, stale)
- [ ] Report `fault` flag per sensor channel in telemetry
- [ ] Separate Wokwi pin assignments from production board map
- [ ] Validate strapping pins and boot-sensitive pins before hardware assembly

---

## P1 — Telemetry Shape

Align published telemetry with the agreed MQTT contract.

- [ ] Publish structured JSON matching spec: `soil_moisture`, `pump_state`, `current`, `fault`
- [ ] Add `device_id` and `firmware_version` fields to every telemetry message
- [ ] Implement telemetry rate limiting (configurable interval)
- [ ] Add telemetry batching if needed for low-bandwidth situations
- [ ] Implement `pm_telemetry_publish_sample` with real MQTT payload serialization
- [ ] Implement `pm_telemetry_publish_state` with real MQTT payload

---

## P1 — OTA

Required for field updates without physical access.

- [ ] Implement OTA artifact download (HTTPS)
- [ ] Add firmware signature verification
- [ ] Implement rollback-safe update (esp_ota partition swap)
- [ ] Report OTA progress and failure reason via MQTT or telemetry
- [ ] Add recovery behavior for interrupted updates
- [ ] Implement `pm_ota_check_for_update` with real version comparison
- [ ] Implement `pm_ota_apply_pending_update` with partition write

---

## P2 — Security & Provisioning

Production readiness before field deployment.

- [ ] Replace placeholder device token with backend-issued credentials
- [ ] Replace placeholder broker fingerprint with provisioned SHA-256
- [ ] Implement secure provisioning flow (serial / BLE / initial AP)
- [ ] Add provisioning state machine: unprovisioned → provisioning → provisioned
- [ ] Support credential rotation
- [ ] Keep `PM_ALLOW_INSECURE_DEV_CONFIG` compile-time only, off by default in production builds
- [ ] Document final certificate trust strategy for field devices

---

## P2 — Observability

Useful for field debugging once devices are deployed.

- [ ] Expand diagnostics beyond boot reset context
- [ ] Add structured device logs for comms, sensor, and actuator events
- [ ] Publish periodic health summaries to backend
- [ ] Add boot count and uptime to telemetry

---

## P2 — Testing

- [ ] Unit tests for configuration validation logic
- [ ] Unit tests for protocol topic generation
- [ ] Unit tests for device state transitions
- [ ] Unit tests for pump safety limit enforcement
- [ ] Integration test for boot-to-comm start sequence
- [ ] Hardware-in-the-loop coverage for ESP32-C3
- [ ] Wokwi smoke tests for full demo wiring

---

## P2 — Documentation

- [ ] Add pinout reference once SuperMini revision is frozen
- [ ] Document provisioning procedure
- [ ] Update `ARCHITECTURE.md` when MQTT and pump control are implemented
- [ ] Update this TODO when items move from scaffold to implemented

---

## Already Verified ✅

- [x] ESP32-C3 target alignment (`esp32c3`, 4MB flash)
- [x] Firmware builds successfully for ESP32-C3
- [x] NVS initialization wired into boot
- [x] Security validation blocks comms when credentials are insecure
- [x] Device state lifecycle tracking implemented
- [x] Boot diagnostics (reset reason) captured
- [x] Wokwi scaffold: DHT22 (GPIO4), soil moisture ADC (GPIO0), pump LED (GPIO7)
- [x] DHT22 bit-bang driver implemented
- [x] Capacitive soil moisture via ADC oneshot implemented
- [x] Pump LED GPIO control implemented
- [x] Main sensing loop with 30s telemetry interval
- [x] Dev mode (`PM_ALLOW_INSECURE_DEV_CONFIG`) for Wokwi builds
