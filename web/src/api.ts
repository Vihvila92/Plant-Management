import type {
  AuthSession,
  DashboardData,
  DeviceSummary,
  HealthSnapshot,
  LocationSummary,
  PlantSummary,
  ProtocolSnapshot
} from "./types";
import { clearAuthToken, loadAuthToken } from "./auth";

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? "/api";

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number
  ) {
    super(message);
  }
}

async function fetchJson<T>(path: string, init?: RequestInit): Promise<T> {
  const token = loadAuthToken();
  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...init,
    headers: {
      Accept: "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers ?? {})
    }
  });

  if (!response.ok) {
    if (response.status === 401) {
      clearAuthToken();
    }

    let message = `Request failed with status ${response.status}`;

    try {
      const body = (await response.json()) as { message?: string };
      if (typeof body.message === "string") {
        message = body.message;
      }
    } catch {
      // Keep default message.
    }

    throw new ApiError(message, response.status);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export async function login(username: string, password: string): Promise<AuthSession> {
  const response = await fetch(`${apiBaseUrl}/auth/login`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ username, password })
  });

  if (!response.ok) {
    let message = `Login failed with status ${response.status}`;

    try {
      const body = (await response.json()) as { message?: string };
      if (typeof body.message === "string") {
        message = body.message;
      }
    } catch {
      // Keep default message.
    }

    throw new ApiError(message, response.status);
  }

  const payload = (await response.json()) as { item: AuthSession };
  return payload.item;
}

export async function logout(): Promise<void> {
  await fetchJson<void>("/auth/logout", {
    method: "POST"
  });
}

export async function loadDashboardData(): Promise<DashboardData> {
  const [healthResponse, devicesResponse, plantsResponse, locationsResponse, protocolResponse] = await Promise.all([
    fetchJson<HealthSnapshot>("/health"),
    fetchJson<{ items: DeviceSummary[] }>("/devices"),
    fetchJson<{ items: PlantSummary[] }>("/plants"),
    fetchJson<{ items: LocationSummary[] }>("/locations"),
    fetchJson<ProtocolSnapshot>("/protocol")
  ]);

  return {
    source: "live",
    fetchedAt: new Date().toISOString(),
    health: healthResponse,
    devices: devicesResponse.items,
    plants: plantsResponse.items,
    locations: locationsResponse.items,
    protocol: protocolResponse
  };
}
