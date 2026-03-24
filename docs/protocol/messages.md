# Message Shapes

All payloads are JSON objects. Field names use `camelCase` in the transport contract.

The current backend demo bridge publishes snapshot-style MQTT payloads. The firmware-side atomic shapes are documented here as the canonical data model that the snapshot is built from.

## Common conventions

- `deviceId` is the stable device identifier.
- `publishedAt` is an ISO 8601 timestamp in UTC.
- `timestampMs`, `lastHeartbeatMs`, and similar machine timings are Unix epoch milliseconds.
- Unknown fields should be ignored only where the schema explicitly allows it.

## Device State

The device state envelope communicates lifecycle and health information.

```json
{
  "deviceId": "pm-esp32c3-001",
  "firmwareVersion": "0.1.0-dev",
  "lifecycle": "online",
  "health": "ok",
  "connected": true,
  "bootCount": 1,
  "lastErrorCode": 0,
  "lastHeartbeatMs": 1711200000000
}
```

Field notes:

| Field | Required | Notes |
| --- | --- | --- |
| `deviceId` | Yes | Stable per-device identifier |
| `firmwareVersion` | Yes | Firmware build or release label |
| `lifecycle` | Yes | `booting`, `provisioning`, `online`, `offline`, or `error` |
| `health` | Yes | `unknown`, `ok`, `warn`, or `error` |
| `connected` | Yes | Whether the broker connection is active |
| `bootCount` | Yes | Monotonic boot counter |
| `lastErrorCode` | No | Last device-side error code |
| `lastHeartbeatMs` | No | Last heartbeat timestamp in ms |

## Telemetry Sample

This is the atomic measurement object that can be embedded in telemetry batches or stored as history.

```json
{
  "id": "meas-0001",
  "channelId": "soil-1",
  "channelKey": "soil_moisture",
  "value": 61,
  "unit": "%",
  "quality": "good",
  "recordedAt": "2026-03-23T15:00:00.000Z",
  "source": "device"
}
```

Field notes:

| Field | Required | Notes |
| --- | --- | --- |
| `id` | Yes | Stable record identifier |
| `channelId` | Yes | Internal channel identifier |
| `channelKey` | Yes | Stable semantic key such as `soil_moisture` |
| `value` | Yes | Calibrated or normalized value |
| `unit` | Yes | Human-readable unit |
| `quality` | Yes | `good`, `estimated`, or `fault` |
| `recordedAt` | Yes | ISO 8601 timestamp |
| `source` | Yes | `device` or `derived` |

## Command Request

This is the operator-facing command body and the payload nested inside MQTT command envelopes.

```json
{
  "kind": "water",
  "amountMl": 250,
  "requestedBy": "operator",
  "reason": "Manual watering check",
  "correlationId": "optional-client-correlation-id"
}
```

Field notes:

| Field | Required | Notes |
| --- | --- | --- |
| `kind` | Yes | Currently `water` only |
| `amountMl` | Yes | Requested water amount in milliliters |
| `requestedBy` | Yes | Operator identity or automation tag |
| `reason` | Yes | Human-readable operator reason |
| `correlationId` | No | Client-provided trace id; backend generates one if absent |

## MQTT Snapshot Envelopes

The backend demo bridge currently wraps the atomic fields above into snapshot messages for the UI and integration layer.

### State snapshot

```json
{
  "deviceId": "pm-esp32c3-001",
  "device": {
    "id": "pm-esp32c3-001",
    "name": "East Shelf A",
    "role": "combined",
    "status": "online",
    "firmwareVersion": "0.1.0",
    "lastSeenAt": "2026-03-23T15:00:00.000Z",
    "location": {
      "room": "Greenhouse",
      "zone": "East shelf"
    },
    "capabilities": ["soil_moisture", "air_temperature", "air_humidity", "tank_level", "pump_control"],
    "activeAlerts": 0
  },
  "activeCommands": [],
  "publishedAt": "2026-03-23T15:00:05.000Z"
}
```

### Telemetry snapshot

```json
{
  "deviceId": "pm-esp32c3-001",
  "channels": [
    {
      "id": "soil-1",
      "key": "soil_moisture",
      "label": "Soil moisture",
      "unit": "%",
      "rawValue": 2180,
      "calibratedValue": 61,
      "quality": "good",
      "updatedAt": "2026-03-23T15:00:00.000Z"
    }
  ],
  "measurements": [
    {
      "id": "meas-0001",
      "channelId": "soil-1",
      "channelKey": "soil_moisture",
      "value": 61,
      "unit": "%",
      "quality": "good",
      "recordedAt": "2026-03-23T15:00:00.000Z",
      "source": "device"
    }
  ],
  "publishedAt": "2026-03-23T15:00:05.000Z"
}
```

### Command envelope

```json
{
  "commandId": "cmd-0001",
  "deviceId": "pm-esp32c3-001",
  "request": {
    "kind": "water",
    "amountMl": 250,
    "requestedBy": "operator",
    "reason": "Manual watering check",
    "correlationId": "optional-client-correlation-id"
  },
  "publishedAt": "2026-03-23T15:00:05.000Z"
}
```

## Command Lifecycle

The target command lifecycle is:

`queued -> sent -> running -> completed | failed`

The current backend stores queued commands in the device repository. ACK/result events are reserved for the device-side implementation and are not yet part of the live transport bridge.

### Command event

This is the reserved device-to-backend event shape for ACK, execution start, completion, and failure.

```json
{
  "commandId": "cmd-0001",
  "deviceId": "pm-esp32c3-001",
  "status": "running",
  "accepted": true,
  "detail": "pump started",
  "publishedAt": "2026-03-23T15:00:06.000Z",
  "correlationId": "optional-client-correlation-id"
}
```

| Field | Required | Notes |
| --- | --- | --- |
| `commandId` | Yes | Backend-generated command identifier |
| `deviceId` | Yes | Target device |
| `status` | Yes | `accepted`, `running`, `completed`, or `failed` |
| `accepted` | Yes | Boolean ACK result for the command |
| `detail` | No | Human-readable execution detail |
| `publishedAt` | Yes | ISO 8601 timestamp |
| `correlationId` | No | Trace id carried across the command flow |

## Security Rules

- Every device must use a unique credential.
- The broker identity must be verified before command or OTA flows are enabled.
- If credentials or trust anchors are missing, the firmware must remain disconnected rather than opening an insecure channel.
- The `mqtts://` transport is the default and expected production transport.

## Current Limitations

- The MQTT publish/subscribe implementation is still scaffold-level.
- ACK/result events are not yet emitted end-to-end.
- OTA command transport is not yet finalized.
- Certificate rotation and provisioning APIs are still TODO.
