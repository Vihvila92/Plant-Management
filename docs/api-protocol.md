# API and Protocol Contract

This document is the canonical compatibility snapshot for the backend HTTP API and the MQTT bridge.
Current protocol version: `0.1.0`.

The contract is additive-only within the `v1` topic namespace and the current HTTP routes. Breaking changes require a new versioned route, namespace, or schema file.

## Authentication Model

Operator access uses bearer sessions. The implementation currently supports one configured admin identity, not a multi-user directory.

| Endpoint | Auth | Purpose | Notes |
| --- | --- | --- | --- |
| `POST /api/auth/login` | No | Create a bearer session | Body: `{ "username": string, "password": string }` |
| `GET /api/auth/session` | Bearer | Validate current session | Returns the active session or `401` |
| `POST /api/auth/logout` | Bearer | Revoke current session | Returns `204` |

Login failure responses are structured and may return:

| Status | Error | Meaning |
| --- | --- | --- |
| `401` | `invalid_credentials` | Username or password is wrong |
| `429` | `rate_limited` | Too many failed attempts from the same client bucket |
| `503` | `auth_not_configured` | Server auth env vars are missing |

Authentication is configured through environment variables in the backend:

| Variable | Purpose |
| --- | --- |
| `PM_ADMIN_USERNAME` | Configured operator username |
| `PM_ADMIN_PASSWORD` | Plaintext development password |
| `PM_ADMIN_PASSWORD_HASH` | Preferred `scrypt` hash format |
| `PM_SESSION_TTL_MS` | Session lifetime |
| `PM_AUTH_MAX_ATTEMPTS` | Failed-login threshold |
| `PM_AUTH_LOCKOUT_MS` | Lockout duration |
| `PM_TRUST_PROXY` | Enables `x-forwarded-for` based rate-limit bucketing |

Current auth limitations:

- Sessions are in memory and are lost on process restart.
- There is no RBAC, refresh token flow, password reset flow, or user management UI yet.
- The login service is single-operator by design for the current phase.

## HTTP API Surface

| Route | Auth | Purpose | Notes |
| --- | --- | --- | --- |
| `GET /api/health` | No | Public service health snapshot | Includes runtime metadata and protocol version |
| `GET /api/devices` | Bearer | List devices | Inventory view for the web UI |
| `GET /api/plants` | Bearer | List plants | Source of truth for plant metadata |
| `GET /api/locations` | Bearer | List locations | Source of truth for room/zone metadata |
| `GET /api/devices/:deviceId` | Bearer | Get device detail | Includes channels, measurements, and queued commands |
| `POST /api/devices/:deviceId/commands` | Bearer | Queue manual watering command | Current command type: `water` |
| `GET /api/protocol` | Bearer | Return protocol snapshot | Machine-readable compatibility contract |

The command request body is currently:

```json
{
  "kind": "water",
  "amountMl": 250,
  "requestedBy": "operator",
  "reason": "Manual watering check",
  "correlationId": "optional-client-correlation-id"
}
```

`correlationId` is optional on input. If omitted, the backend generates one.

## MQTT Contract

Canonical namespace:

```text
plants/v1/devices/{deviceId}/
```

| Topic | Direction | Status | Payload |
| --- | --- | --- | --- |
| `state` | Device -> backend | Canonical | Device summary and active command state |
| `telemetry` | Device -> backend | Canonical | Sensor and actuator telemetry snapshot |
| `commands` | Backend -> device | Canonical | Command envelope with request payload |
| `commands/{commandId}/events` | Device -> backend | Reserved | ACK / running / completed / failed events |
| `config/desired` | Backend -> device | Canonical | Desired device configuration |
| `config/reported` | Device -> backend | Reserved | Device-applied configuration report |

The current backend bridge subscribes to `commands` and `config/desired`, and publishes `state`, `telemetry`, and `commands` in the demo scaffold. The remaining topics are reserved for the device-side implementation and should not be treated as stable runtime behavior yet.

## Security Baseline

- Every device must have a unique credential. Shared fleet defaults are not acceptable outside explicit development mode.
- Normal operation must use `mqtts://`.
- Broker identity verification is required before starting command or OTA flows.
- If secure credentials are missing, the firmware must stay in a disconnected or degraded mode instead of opening an insecure connection.
- Device IDs are stable identifiers, not display names.

## Versioning Rules

- API routes are versioned by path and protocol snapshot.
- MQTT namespaces are versioned by topic prefix.
- JSON Schema files use `.v1.json` suffixes and are intentionally version-scoped.
- Unknown fields should be treated as forward-compatible only when the owning schema explicitly allows it.

## Current Limitations and Gaps

- Device provisioning, command ACKs, command results, and OTA transport are not yet fully implemented end-to-end.
- MQTT transport in the backend is still scaffold-level.
- The HTTP API currently relies on an in-memory session store.
- CORS is permissive for local development and must be tightened before deployment.
- `GET /api/protocol` is the compatibility anchor, but the schema files are still draft-quality and need CI validation.
