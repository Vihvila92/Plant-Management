import { randomUUID } from "node:crypto";
import type {
  CommandSummary,
  DeviceCommandRequest,
  DeviceDetail,
  DeviceSummary,
  LocationSummary,
  PlantSummary
} from "./types.js";
import { protocolVersion, protocolSnapshot } from "../protocol/catalog.js";

export interface HealthSnapshot {
  service: string;
  status: "ok";
  version: string;
  protocolVersion: string;
  uptimeSeconds: number;
  database: "configured" | "not-configured";
  generatedAt: string;
}

export class InMemoryDeviceRepository {
  private readonly devices = new Map<string, DeviceDetail>();
  private readonly plants = new Map<string, PlantSummary>();
  private readonly locations = new Map<string, LocationSummary>();

  private commandCounter = 1;

  constructor(seed: { devices: DeviceDetail[]; plants: PlantSummary[]; locations: LocationSummary[] }) {
    for (const location of seed.locations) {
      this.locations.set(location.id, structuredClone(location));
    }

    for (const plant of seed.plants) {
      this.plants.set(plant.id, structuredClone(plant));
    }

    for (const device of seed.devices) {
      this.devices.set(device.id, structuredClone(device));
    }
  }

  listDevices(): DeviceSummary[] {
    return [...this.devices.values()].map(({ channels, recentMeasurements, pendingCommands, notes, ...summary }) => summary);
  }

  getDevice(deviceId: string): DeviceDetail | undefined {
    return this.devices.get(deviceId);
  }

  listPlants(): PlantSummary[] {
    return [...this.plants.values()];
  }

  listLocations(): LocationSummary[] {
    return [...this.locations.values()];
  }

  queueWaterCommand(deviceId: string, request: DeviceCommandRequest): CommandSummary | undefined {
    const device = this.devices.get(deviceId);

    if (!device) {
      return undefined;
    }

    const command: CommandSummary = {
      id: `cmd-${this.commandCounter++}`,
      kind: "water",
      status: "queued",
      requestedAt: new Date().toISOString(),
      requestedBy: request.requestedBy,
      amountMl: request.amountMl,
      reason: request.reason,
      correlationId: request.correlationId ?? randomUUID()
    };

    device.pendingCommands = [command, ...device.pendingCommands].slice(0, 5);
    device.lastSeenAt = new Date().toISOString();

    this.devices.set(deviceId, device);

    return command;
  }

  getProtocolHealth(startedAt: number): HealthSnapshot {
    return {
      service: "plant-management-backend",
      status: "ok",
      version: protocolVersion,
      protocolVersion: protocolSnapshot.protocolVersion,
      uptimeSeconds: Math.floor((Date.now() - startedAt) / 1000),
      database: process.env.DATABASE_URL ? "configured" : "not-configured",
      generatedAt: new Date().toISOString()
    };
  }
}

export function createDemoDevices(): DeviceDetail[] {
  const now = new Date();

  const timestamp = (minutesAgo: number): string => {
    const date = new Date(now);
    date.setMinutes(date.getMinutes() - minutesAgo);
    return date.toISOString();
  };

  return [
    {
      id: "greenhouse-east-shelf-a",
      name: "East Shelf A",
      role: "combined",
      status: "online",
      firmwareVersion: "0.1.0",
      lastSeenAt: timestamp(1),
      location: { room: "Greenhouse", zone: "East shelf" },
      capabilities: ["soil_moisture", "air_temperature", "air_humidity", "tank_level", "pump_control"],
      activeAlerts: 0,
      channels: [
        {
          id: "soil-1",
          key: "soil_moisture",
          label: "Soil moisture",
          unit: "%",
          rawValue: 2180,
          calibratedValue: 61,
          quality: "good",
          updatedAt: timestamp(2)
        },
        {
          id: "air-temp-1",
          key: "air_temperature",
          label: "Air temperature",
          unit: "°C",
          rawValue: 23.4,
          calibratedValue: 23.4,
          quality: "good",
          updatedAt: timestamp(2)
        },
        {
          id: "air-humidity-1",
          key: "air_humidity",
          label: "Air humidity",
          unit: "%",
          rawValue: 57,
          calibratedValue: 57,
          quality: "good",
          updatedAt: timestamp(2)
        }
      ],
      recentMeasurements: [
        {
          id: "meas-1",
          channelId: "soil-1",
          channelKey: "soil_moisture",
          value: 61,
          unit: "%",
          quality: "good",
          recordedAt: timestamp(2),
          source: "device"
        },
        {
          id: "meas-2",
          channelId: "air-temp-1",
          channelKey: "air_temperature",
          value: 23.4,
          unit: "°C",
          quality: "good",
          recordedAt: timestamp(2),
          source: "device"
        },
        {
          id: "meas-3",
          channelId: "air-humidity-1",
          channelKey: "air_humidity",
          value: 57,
          unit: "%",
          quality: "good",
          recordedAt: timestamp(2),
          source: "device"
        }
      ],
      pendingCommands: [],
      notes: [
        "Primary combined node for sensor and watering workflow validation.",
        "Tank level capability is declared but no live alert is raised yet."
      ]
    },
    {
      id: "balcony-herbs-node",
      name: "Balcony Herbs",
      role: "sensor",
      status: "degraded",
      firmwareVersion: "0.1.0",
      lastSeenAt: timestamp(14),
      location: { room: "Balcony", zone: "Herb rail" },
      capabilities: ["soil_moisture", "air_temperature", "air_humidity"],
      activeAlerts: 1,
      channels: [
        {
          id: "soil-2",
          key: "soil_moisture",
          label: "Soil moisture",
          unit: "%",
          rawValue: 1540,
          calibratedValue: 39,
          quality: "estimated",
          updatedAt: timestamp(14)
        },
        {
          id: "air-temp-2",
          key: "air_temperature",
          label: "Air temperature",
          unit: "°C",
          rawValue: 19.8,
          calibratedValue: 19.8,
          quality: "good",
          updatedAt: timestamp(14)
        }
      ],
      recentMeasurements: [
        {
          id: "meas-4",
          channelId: "soil-2",
          channelKey: "soil_moisture",
          value: 39,
          unit: "%",
          quality: "estimated",
          recordedAt: timestamp(14),
          source: "derived"
        },
        {
          id: "meas-5",
          channelId: "air-temp-2",
          channelKey: "air_temperature",
          value: 19.8,
          unit: "°C",
          quality: "good",
          recordedAt: timestamp(14),
          source: "device"
        }
      ],
      pendingCommands: [
        {
          id: "cmd-queued-1",
          kind: "water",
          status: "queued",
          requestedAt: timestamp(20),
          requestedBy: "operator",
          amountMl: 85,
          reason: "Manual check while validating the watering flow.",
          correlationId: "demo-correlation-1"
        }
      ],
      notes: [
        "Signal quality is lower here, so the backend should treat the node as degraded.",
        "Useful for exercising offline and stale-data UI states."
      ]
    }
  ];
}

export function createDemoPlants(): PlantSummary[] {
  return [
    {
      id: "monstera-deliciosa-01",
      name: "Monstera Deliciosa",
      species: "Monstera deliciosa",
      locationId: "greenhouse-east-shelf",
      locationName: "Greenhouse / East shelf",
      substrate: "Chunky aroid mix",
      moistureTargetPercent: {
        min: 48,
        max: 63
      },
      assignedDeviceIds: ["greenhouse-east-shelf-a"],
      status: "stable"
    },
    {
      id: "balcony-basil-01",
      name: "Sweet Basil",
      species: "Ocimum basilicum",
      locationId: "balcony-herb-rail",
      locationName: "Balcony / Herb rail",
      substrate: "Herb potting mix",
      moistureTargetPercent: {
        min: 52,
        max: 68
      },
      assignedDeviceIds: ["balcony-herbs-node"],
      status: "watch"
    }
  ];
}

export function createDemoLocations(): LocationSummary[] {
  return [
    {
      id: "greenhouse-east-shelf",
      name: "East Shelf",
      room: "Greenhouse",
      zone: "East shelf",
      plantCount: 1,
      deviceCount: 1
    },
    {
      id: "balcony-herb-rail",
      name: "Herb Rail",
      room: "Balcony",
      zone: "Herb rail",
      plantCount: 1,
      deviceCount: 1
    }
  ];
}
