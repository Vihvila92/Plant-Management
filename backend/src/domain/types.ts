export type DeviceRole = "sensor" | "watering" | "combined";

export type DeviceStatus = "online" | "offline" | "degraded";

export type Capability =
  | "soil_moisture"
  | "air_temperature"
  | "air_humidity"
  | "tank_level"
  | "pump_control";

export type MeasurementQuality = "good" | "estimated" | "fault";

export interface DeviceLocation {
  room: string;
  zone: string;
}

export interface LocationSummary {
  id: string;
  name: string;
  room: string;
  zone: string;
  plantCount: number;
  deviceCount: number;
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

export interface SensorChannel {
  id: string;
  key: string;
  label: string;
  unit: string;
  rawValue: number;
  calibratedValue: number;
  quality: MeasurementQuality;
  updatedAt: string;
}

export interface MeasurementRecord {
  id: string;
  channelId: string;
  channelKey: string;
  value: number;
  unit: string;
  quality: MeasurementQuality;
  recordedAt: string;
  source: "device" | "derived";
}

export interface CommandSummary {
  id: string;
  kind: "water";
  status: "queued" | "sent" | "running" | "completed" | "failed";
  requestedAt: string;
  requestedBy: string;
  amountMl: number;
  reason: string;
  correlationId: string;
}

export interface DeviceSummary {
  id: string;
  name: string;
  role: DeviceRole;
  status: DeviceStatus;
  firmwareVersion: string;
  lastSeenAt: string;
  location: DeviceLocation;
  capabilities: Capability[];
  activeAlerts: number;
}

export interface DeviceDetail extends DeviceSummary {
  channels: SensorChannel[];
  recentMeasurements: MeasurementRecord[];
  pendingCommands: CommandSummary[];
  notes: string[];
}

export interface DeviceCommandRequest {
  kind: "water";
  amountMl: number;
  requestedBy: string;
  reason: string;
  correlationId?: string;
}
