# Plant-Management Protocol

This directory defines the device-facing contract for Plant-Management.
Operator auth lives in [`docs/api-protocol.md`](../api-protocol.md); this directory is focused on device transport, message semantics, and security assumptions.

## Scope

- MQTT topic structure.
- Device state and telemetry message shapes.
- Command request, ACK, and result semantics.
- Versioning and compatibility rules.
- Firmware security boundaries and fail-closed behavior.

## Canonical Rules

- Plant-Management remains the source of truth.
- Device messages are versioned explicitly.
- Firmware may validate and enforce local safety limits, but it does not own watering policy.
- Home Assistant integration is intentionally excluded from the MVP and will later be implemented as a dedicated integration against the platform API.
- Device connections are expected to use unique per-device credentials and TLS-validated broker connections.
- Missing security material must result in a disconnected or degraded device state, not an insecure fallback.

## Security Assumptions

- Default MQTT URI is `mqtts://`.
- The broker certificate must be verified before the firmware starts command or OTA flows.
- Shared fleet credentials are not acceptable outside explicit development mode.
- The provisioning flow must make the device token and broker trust anchor unique per device.
- The current firmware scaffold contains development-time escape hatches, but they are disabled by default and must not be relied on in production.

## Versioning Rules

- Topic namespaces are versioned by path segment, currently `plants/v1/...`.
- JSON schemas are versioned by filename suffix, currently `.v1.json`.
- Compatibility is additive-only within the current version line.
- If a field or command semantics change in a breaking way, the new contract needs a new versioned schema or namespace.

## Protocol Areas

- `mqtt-topics.md` defines the canonical topic tree and direction of travel.
- `messages.md` defines the JSON message envelopes and current payload semantics.
- `schemas/` contains JSON Schema drafts for machine-readable validation.

## Current Gaps

- Device onboarding and credential issuance are not yet documented as a complete end-to-end flow.
- Command ACK/result and OTA transport are still reserved rather than fully implemented.
- Certificate rotation policy is not finalized.
- Schema validation is not yet enforced in CI.
