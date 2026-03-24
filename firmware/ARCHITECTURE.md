# Firmware Architecture

This document describes the current firmware architecture for Plant-Management as it exists today: an ESP32-C3-oriented scaffold with secure boot-time gating, explicit module boundaries, and a Wokwi demo setup for early validation.

## Goals

- Keep the firmware portable across ESP32-C3 nodes.
- Use one firmware image for all nodes and let backend configuration decide role and enabled channels.
- Fail closed when security prerequisites are not satisfied.
- Keep protocol, telemetry, OTA, and diagnostics boundaries explicit so the backend can evolve independently.

## High-Level Runtime Model

The firmware is organized around a simple startup pipeline:

1. `app_main` initializes NVS.
2. Configuration is loaded with safe defaults.
3. Security validation decides whether comms are allowed.
4. Device state and diagnostics are initialized.
5. OTA and comms start only if the device is provisioned securely.
6. Boot telemetry and heartbeat state are published through the comms boundary.

This keeps the device deterministic at boot and prevents accidental fail-open connectivity.

## Component Responsibilities

| Component | Responsibility | Current State |
| --- | --- | --- |
| `main/` | Boot orchestration and lifecycle sequencing | Implemented as scaffold |
| `config/` | Runtime config model, defaults, and security validation | Implemented |
| `device_state/` | Lifecycle, health, heartbeat tracking | Implemented as scaffold |
| `telemetry/` | State and sample publishing boundary | Implemented as scaffold |
| `comm/` | MQTT communication boundary | Implemented as scaffold |
| `protocol/` | Topic helpers and command naming | Implemented as scaffold |
| `diagnostics/` | Boot diagnostics and reset context | Implemented as scaffold |
| `ota/` | OTA lifecycle boundary | Implemented as scaffold |

The separation is intentional. It avoids a monolithic firmware file and lets each concern mature independently.

## Configuration Model

The current `pm_config_t` contains:

- device identity and role
- MQTT broker URI and client ID
- firmware version
- device token
- broker fingerprint
- telemetry and heartbeat intervals
- OTA enablement
- manual watering enablement
- TLS and certificate verification flags

Security validation currently enforces:

- `mqtts://` transport when TLS is required
- non-placeholder device credentials
- non-placeholder broker fingerprint
- a syntactically valid SHA-256 fingerprint
- TLS and certificate verification by default

If validation fails, the firmware keeps the device offline for comms.

## Device State Model

The device state layer tracks:

- lifecycle
- health
- boot count
- last error code
- last heartbeat time
- connection flag

This is a local runtime view, not the authoritative plant backend model. The backend remains the system of record.

## Telemetry Boundary

Telemetry currently models three sample kinds:

- sensor
- system
- actuator

The transport layer is still abstracted behind the comms component. That keeps sample generation separate from message delivery and makes it easier to move from scaffold to a real MQTT client later.

## Communications Boundary

The comms layer currently defines:

- initialization
- start/stop lifecycle
- heartbeat publishing
- measurement publishing
- command-result publishing

This is the right shape for the future device broker integration, but the actual transport code still needs to be implemented.

## Protocol Boundary

The protocol layer currently owns:

- protocol version constants
- topic prefixing
- command type enumeration
- topic-building helpers

Keeping this in one place prevents topic naming from becoming a hidden dependency across the codebase.

## OTA Boundary

OTA exists as an explicit boundary with status tracking, but the following are not yet implemented:

- signed artifact delivery
- trust validation
- rollback logic
- recovery flow
- update progress reporting

The architecture already reserves this surface so the implementation can be added without reshaping the firmware tree.

## Diagnostics Boundary

Diagnostics currently capture boot-time reset context. This is important for future field debugging, especially when the device is running without a display and the only reliable evidence is serial logs plus backend telemetry.

## Wokwi Architecture

The Wokwi setup is intentionally simple:

- `ESP32-C3 DevKitM-1` is used as the closest supported simulation board.
- `DHT22` represents air humidity and temperature.
- Potentiometer represents soil moisture.
- LED represents pump activity.

This is enough to demonstrate the control flow and future telemetry shape without pretending to be a full hardware emulation of the final board.

## Physical Pinout Policy

The physical SuperMini pinout is not locked by this scaffold.

Policy:

- Wokwi pin assignments are demo-only.
- Production pin assignments must be validated against the exact SuperMini revision.
- Strapping pins and boot-sensitive pins should be treated carefully during hardware design.
- The firmware should eventually expose board-specific pin mapping in one place instead of scattering GPIO constants across modules.

## Security Architecture Notes

The intended security model is:

- secure provisioning before comms
- TLS-only device transport
- certificate verification enabled by default
- backend-issued device credentials
- command and telemetry traffic tied to a provisioned device identity

The current implementation already enforces the first layer of this model by refusing to start comms when credentials are not secure enough.

## What Is Still Scaffold

- Real Wi-Fi provisioning
- Real MQTT transport
- Real sensor drivers
- Pump control and feedback
- OTA transfer and rollback
- Credential lifecycle handling
- Persistent calibration and board mapping
- Integration tests and hardware validation
