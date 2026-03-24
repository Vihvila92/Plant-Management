# MQTT Topics

Canonical topic prefix:

```text
plants/v1/devices/{deviceId}/
```

The topic tree is versioned at the namespace level. Do not introduce unversioned topics for production features.

| Topic | Direction | Status | Purpose |
| --- | --- | --- | --- |
| `state` | Device -> backend | Canonical | Lifecycle, health, and active command snapshot |
| `telemetry` | Device -> backend | Canonical | Sensor and actuator telemetry snapshot |
| `commands` | Backend -> device | Canonical | Command envelope carrying the request payload |
| `commands/{commandId}/events` | Device -> backend | Reserved | Command ACK, running, completed, failed events |
| `config/desired` | Backend -> device | Canonical | Desired configuration delta |
| `config/reported` | Device -> backend | Reserved | Applied configuration report |

## Examples

```text
plants/v1/devices/pm-esp32c3-001/state
plants/v1/devices/pm-esp32c3-001/telemetry
plants/v1/devices/pm-esp32c3-001/commands
plants/v1/devices/pm-esp32c3-001/commands/cmd-0001/events
plants/v1/devices/pm-esp32c3-001/config/desired
plants/v1/devices/pm-esp32c3-001/config/reported
```

## Conventions

- Use one namespace per physical device.
- Keep commands and command results separate.
- Publish state changes as retained messages where it helps consumers recover after reconnect.
- Treat telemetry as append-only history.
- Reserve OTA topics only after the transport contract is finalized.

## Current Implementation Notes

- The backend demo bridge currently subscribes to `commands` and `config/desired`.
- The backend demo bridge currently publishes `state`, `telemetry`, and `commands`.
- `commands/{commandId}/events` and `config/reported` are documented targets, but they are not yet active runtime behavior.
