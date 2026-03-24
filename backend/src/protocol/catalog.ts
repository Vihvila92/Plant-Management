import type { DeviceCommandRequest, DeviceDetail, DeviceSummary } from "../domain/types.js";

export const protocolVersion = "0.1.0";

export const mqttTopics = {
  telemetry: "plants/v1/devices/{deviceId}/telemetry",
  state: "plants/v1/devices/{deviceId}/state",
  commands: "plants/v1/devices/{deviceId}/commands",
  commandEvents: "plants/v1/devices/{deviceId}/commands/{commandId}/events",
  configDesired: "plants/v1/devices/{deviceId}/config/desired",
  configReported: "plants/v1/devices/{deviceId}/config/reported"
} as const;

export const httpEndpoints = [
  "GET /api/health",
  "GET /api/devices",
  "GET /api/plants",
  "GET /api/locations",
  "GET /api/devices/:deviceId",
  "POST /api/devices/:deviceId/commands",
  "GET /api/protocol"
] as const;

export interface ProtocolSnapshot {
  protocolVersion: string;
  httpEndpoints: readonly string[];
  mqttTopics: typeof mqttTopics;
  deviceShape: {
    summary: string;
    detail: string;
    commandRequest: string;
  };
}

export const protocolSnapshot: ProtocolSnapshot = {
  protocolVersion,
  httpEndpoints,
  mqttTopics,
  deviceShape: {
    summary: "DeviceSummary describes inventory, health, capabilities, and location.",
    detail: "DeviceDetail extends the summary with channels, measurements, and pending commands.",
    commandRequest: "DeviceCommandRequest currently supports manual watering requests."
  }
};

export interface MqttDeviceStateMessage {
  deviceId: string;
  device: DeviceSummary;
  activeCommands: DeviceDetail["pendingCommands"];
  publishedAt: string;
}

export interface MqttDeviceTelemetryMessage {
  deviceId: string;
  channels: DeviceDetail["channels"];
  measurements: DeviceDetail["recentMeasurements"];
  publishedAt: string;
}

export interface MqttDeviceCommandMessage {
  commandId: string;
  deviceId: string;
  request: DeviceCommandRequest;
  publishedAt: string;
}
