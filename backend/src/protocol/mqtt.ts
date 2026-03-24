import { mqttTopics } from "./catalog.js";
import type { DeviceCommandRequest, DeviceDetail, DeviceSummary } from "../domain/types.js";

export interface PublishedMessage {
  topic: string;
  payload: string;
  publishedAt: string;
}

export interface MqttTransport {
  connect(): Promise<void>;
  publish(topic: string, payload: string): Promise<void>;
  subscribe(topic: string): Promise<void>;
  disconnect(): Promise<void>;
}

export class StubMqttTransport implements MqttTransport {
  public readonly publishedMessages: PublishedMessage[] = [];

  public readonly subscriptions: string[] = [];

  public connected = false;

  async connect(): Promise<void> {
    this.connected = true;
  }

  async publish(topic: string, payload: string): Promise<void> {
    this.publishedMessages.push({
      topic,
      payload,
      publishedAt: new Date().toISOString()
    });
  }

  async subscribe(topic: string): Promise<void> {
    this.subscriptions.push(topic);
  }

  async disconnect(): Promise<void> {
    this.connected = false;
  }
}

export class MqttBridge {
  constructor(private readonly transport: MqttTransport) {}

  async connect(): Promise<void> {
    await this.transport.connect();
    await this.transport.subscribe("plants/v1/devices/+/commands");
    await this.transport.subscribe("plants/v1/devices/+/config/desired");
  }

  async publishDeviceState(device: DeviceSummary, activeCommands: DeviceDetail["pendingCommands"]): Promise<void> {
    await this.transport.publish(
      mqttTopics.state.replace("{deviceId}", device.id),
      JSON.stringify({
        deviceId: device.id,
        device,
        activeCommands,
        publishedAt: new Date().toISOString()
      })
    );
  }

  async publishTelemetry(device: DeviceDetail): Promise<void> {
    await this.transport.publish(
      mqttTopics.telemetry.replace("{deviceId}", device.id),
      JSON.stringify({
        deviceId: device.id,
        channels: device.channels,
        measurements: device.recentMeasurements,
        publishedAt: new Date().toISOString()
      })
    );
  }

  async publishCommand(deviceId: string, commandId: string, request: DeviceCommandRequest): Promise<void> {
    await this.transport.publish(
      mqttTopics.commands.replace("{deviceId}", deviceId),
      JSON.stringify({
        commandId,
        deviceId,
        request,
        publishedAt: new Date().toISOString()
      })
    );
  }
}
