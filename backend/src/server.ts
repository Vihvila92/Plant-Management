import { createServer as createHttpServer } from "node:http";
import type { IncomingMessage, ServerResponse } from "node:http";
import { AuthService } from "./auth.js";
import { InMemoryDeviceRepository } from "./domain/repository.js";
import type { DeviceCommandRequest } from "./domain/types.js";
import { createDemoDevices, createDemoLocations, createDemoPlants } from "./domain/repository.js";
import { MqttBridge, StubMqttTransport } from "./protocol/mqtt.js";
import { protocolSnapshot } from "./protocol/catalog.js";

interface AppContext {
  repository: InMemoryDeviceRepository;
  mqttBridge: MqttBridge;
  authService: AuthService;
  startedAt: number;
}

function sendJson(response: ServerResponse, statusCode: number, body: unknown): void {
  response.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Authorization, Content-Type",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "no-referrer"
  });
  response.end(JSON.stringify(body, null, 2));
}

function sendText(response: ServerResponse, statusCode: number, body: string): void {
  response.writeHead(statusCode, {
    "Content-Type": "text/plain; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Authorization, Content-Type",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "no-referrer"
  });
  response.end(body);
}

async function readJsonBody(request: IncomingMessage, maxBytes = 16 * 1024): Promise<unknown> {
  const chunks: Buffer[] = [];
  let totalBytes = 0;

  for await (const chunk of request) {
    const nextChunk = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    totalBytes += nextChunk.length;

    if (totalBytes > maxBytes) {
      throw new Error("payload_too_large");
    }

    chunks.push(nextChunk);
  }

  if (chunks.length === 0) {
    return undefined;
  }

  const raw = Buffer.concat(chunks).toString("utf8");
  return raw.length === 0 ? undefined : JSON.parse(raw);
}

function sendUnauthorized(response: ServerResponse): void {
  sendJson(response, 401, {
    error: "unauthorized",
    message: "Authentication is required."
  });
}

function getClientIdentifier(request: IncomingMessage): string {
  const trustProxy = process.env.PM_TRUST_PROXY === "true";
  const forwardedFor = request.headers["x-forwarded-for"];

  if (trustProxy && typeof forwardedFor === "string" && forwardedFor.length > 0) {
    return forwardedFor.split(",")[0]?.trim() ?? "unknown";
  }

  return request.socket.remoteAddress ?? "unknown";
}

function getBearerToken(request: IncomingMessage): string | undefined {
  const authorization = request.headers.authorization;

  if (!authorization) {
    return undefined;
  }

  const [scheme, token] = authorization.split(" ");

  if (scheme !== "Bearer" || !token) {
    return undefined;
  }

  return token;
}

function normalizeDeviceId(pathname: string): string | undefined {
  const parts = pathname.split("/").filter(Boolean);
  if (parts.length === 3 && parts[0] === "api" && parts[1] === "devices") {
    return parts[2];
  }

  return undefined;
}

function normalizeCommandDeviceId(pathname: string): string | undefined {
  const parts = pathname.split("/").filter(Boolean);
  if (parts.length === 4 && parts[0] === "api" && parts[1] === "devices" && parts[3] === "commands") {
    return parts[2];
  }

  return undefined;
}

export function createAppContext(): AppContext {
  const repository = new InMemoryDeviceRepository({
    devices: createDemoDevices(),
    plants: createDemoPlants(),
    locations: createDemoLocations()
  });
  const mqttBridge = new MqttBridge(new StubMqttTransport());
  const authService = new AuthService();

  void mqttBridge.connect();

  return {
    repository,
    mqttBridge,
    authService,
    startedAt: Date.now()
  };
}

export function createServerHandler(context: AppContext) {
  return async (request: IncomingMessage, response: ServerResponse): Promise<void> => {
    const requestUrl = new URL(request.url ?? "/", "http://localhost");

    if (request.method === "OPTIONS") {
      response.writeHead(204, {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Authorization, Content-Type",
        "Access-Control-Allow-Methods": "GET,POST,OPTIONS"
      });
      response.end();
      return;
    }

    if (request.method === "GET" && requestUrl.pathname === "/api/health") {
      sendJson(response, 200, context.repository.getProtocolHealth(context.startedAt));
      return;
    }

    if (request.method === "POST" && requestUrl.pathname === "/api/auth/login") {
      let body: { username?: string; password?: string } | undefined;

      try {
        body = (await readJsonBody(request)) as { username?: string; password?: string } | undefined;
      } catch (error) {
        sendJson(response, error instanceof Error && error.message === "payload_too_large" ? 413 : 400, {
          error: "invalid_request",
          message: "Login payload must be valid JSON and under the request size limit."
        });
        return;
      }

      if (!body || typeof body.username !== "string" || typeof body.password !== "string") {
        sendJson(response, 400, {
          error: "invalid_request",
          message: "Expected username and password."
        });
        return;
      }

      const loginResult = context.authService.login(body.username, body.password, getClientIdentifier(request));

      if ("error" in loginResult) {
        sendJson(response, loginResult.error === "rate_limited" ? 429 : loginResult.error === "auth_not_configured" ? 503 : 401, {
          error: loginResult.error,
          message:
            loginResult.error === "rate_limited"
              ? "Too many failed login attempts."
              : loginResult.error === "auth_not_configured"
                ? "Operator authentication is not configured on the server."
                : "Invalid credentials.",
          retryAfterSeconds: loginResult.retryAfterSeconds
        });
        return;
      }

      sendJson(response, 200, {
        item: loginResult
      });
      return;
    }

    if (request.method === "GET" && requestUrl.pathname === "/api/auth/session") {
      const session = context.authService.validate(getBearerToken(request));

      if (!session) {
        sendUnauthorized(response);
        return;
      }

      sendJson(response, 200, {
        item: session
      });
      return;
    }

    if (request.method === "POST" && requestUrl.pathname === "/api/auth/logout") {
      const token = getBearerToken(request);
      context.authService.logout(token);
      sendJson(response, 204, {});
      return;
    }

    if (requestUrl.pathname.startsWith("/api/")) {
      const session = context.authService.validate(getBearerToken(request));

      if (!session) {
        sendUnauthorized(response);
        return;
      }
    }

    if (request.method === "GET" && requestUrl.pathname === "/api/devices") {
      const items = context.repository.listDevices();

      sendJson(response, 200, {
        items,
        total: items.length,
        generatedAt: new Date().toISOString()
      });
      return;
    }

    if (request.method === "GET" && requestUrl.pathname === "/api/plants") {
      const items = context.repository.listPlants();

      sendJson(response, 200, {
        items,
        total: items.length,
        generatedAt: new Date().toISOString()
      });
      return;
    }

    if (request.method === "GET" && requestUrl.pathname === "/api/locations") {
      const items = context.repository.listLocations();

      sendJson(response, 200, {
        items,
        total: items.length,
        generatedAt: new Date().toISOString()
      });
      return;
    }

    if (request.method === "GET" && requestUrl.pathname === "/api/protocol") {
      sendJson(response, 200, {
        ...protocolSnapshot,
        generatedAt: new Date().toISOString()
      });
      return;
    }

    const deviceId = normalizeDeviceId(requestUrl.pathname);

    if (request.method === "GET" && deviceId) {
      const device = context.repository.getDevice(deviceId);

      if (!device) {
        sendJson(response, 404, {
          error: "not_found",
          message: `Device '${deviceId}' was not found.`
        });
        return;
      }

      sendJson(response, 200, {
        item: device,
        generatedAt: new Date().toISOString()
      });
      return;
    }

    const commandDeviceId = normalizeCommandDeviceId(requestUrl.pathname);

    if (request.method === "POST" && requestUrl.pathname.endsWith("/commands") && commandDeviceId) {
      let body: Partial<DeviceCommandRequest> | undefined;

      try {
        body = (await readJsonBody(request)) as Partial<DeviceCommandRequest> | undefined;
      } catch (error) {
        sendJson(response, error instanceof Error && error.message === "payload_too_large" ? 413 : 400, {
          error: error instanceof Error && error.message === "payload_too_large" ? "payload_too_large" : "invalid_json",
          message: error instanceof Error && error.message === "payload_too_large" ? "Request body exceeded the maximum allowed size." : "Request body must be valid JSON."
        });
        return;
      }

      if (!body || body.kind !== "water" || typeof body.amountMl !== "number" || typeof body.requestedBy !== "string" || typeof body.reason !== "string") {
        sendJson(response, 400, {
          error: "invalid_request",
          message: "Expected a water command with amountMl, requestedBy, and reason."
        });
        return;
      }

      const commandRequest: DeviceCommandRequest = body.correlationId
        ? {
            kind: "water",
            amountMl: body.amountMl,
            requestedBy: body.requestedBy,
            reason: body.reason,
            correlationId: body.correlationId
          }
        : {
            kind: "water",
            amountMl: body.amountMl,
            requestedBy: body.requestedBy,
            reason: body.reason
          };

      const command = context.repository.queueWaterCommand(commandDeviceId, commandRequest);

      if (!command) {
        sendJson(response, 404, {
          error: "not_found",
          message: `Device '${commandDeviceId}' was not found.`
        });
        return;
      }

      await context.mqttBridge.publishCommand(commandDeviceId, command.id, commandRequest);

      sendJson(response, 201, {
        item: command,
        protocolVersion: protocolSnapshot.protocolVersion,
        generatedAt: new Date().toISOString()
      });
      return;
    }

    if (request.method === "GET" && requestUrl.pathname === "/") {
      sendText(
        response,
        200,
        [
          "Plant-Management backend",
          "Available endpoints:",
          "GET /api/health",
          "POST /api/auth/login",
          "GET /api/auth/session",
          "POST /api/auth/logout",
          "GET /api/devices",
          "GET /api/plants",
          "GET /api/locations",
          "GET /api/devices/:deviceId",
          "POST /api/devices/:deviceId/commands",
          "GET /api/protocol"
        ].join("\n")
      );
      return;
    }

    sendJson(response, 404, {
      error: "not_found",
      message: "Route not found."
    });
  };
}

export function createServer(appContext = createAppContext()) {
  return createHttpServer(createServerHandler(appContext));
}
