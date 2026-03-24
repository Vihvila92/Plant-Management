export type DeviceRole = "sensor" | "watering" | "combined";

export type DeviceStatus = "online" | "offline" | "degraded";

export interface DeviceLocation {
  room: string;
  zone: string;
}

export interface DeviceSummary {
  id: string;
  name: string;
  role: DeviceRole;
  status: DeviceStatus;
  firmwareVersion: string;
  lastSeenAt: string;
  location: DeviceLocation;
  capabilities: string[];
  activeAlerts: number;
}

export interface PlantSummary {
  id: string;
  name: string;
  species: string;
  locationId: string;
  locationName: string;
  substrate: string;
  moistureTargetPercent: {
    min: number;
    max: number;
  };
  assignedDeviceIds: string[];
  status: "stable" | "watch" | "dry";
}

export interface LocationSummary {
  id: string;
  name: string;
  room: string;
  zone: string;
  plantCount: number;
  deviceCount: number;
}

export interface HealthSnapshot {
  service: string;
  status: "ok";
  version: string;
  protocolVersion: string;
  uptimeSeconds: number;
  database: "configured" | "not-configured";
  generatedAt: string;
}

export interface AuthSession {
  token: string;
  username: string;
  issuedAt: string;
  expiresAt: string;
}

export interface ProtocolSnapshot {
  protocolVersion: string;
  httpEndpoints: string[];
  mqttTopics: Record<string, string>;
  deviceShape: {
    summary: string;
    detail: string;
    commandRequest: string;
  };
  generatedAt: string;
}

export interface DashboardData {
  source: "live" | "mock";
  health: HealthSnapshot;
  devices: DeviceSummary[];
  plants: PlantSummary[];
  locations: LocationSummary[];
  protocol: ProtocolSnapshot;
  fetchedAt: string;
}
