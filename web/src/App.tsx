import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { clearAuthToken, storeAuthToken } from "./auth";
import { ApiError, loadDashboardData, login, logout } from "./api";
import type { AuthSession, DashboardData } from "./types";

function formatTime(value: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

function formatUptime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remaining = seconds % 60;

  return `${hours}h ${minutes}m ${remaining}s`;
}

function statusTone(status: string): string {
  switch (status) {
    case "online":
    case "ok":
    case "stable":
      return "success";
    case "degraded":
    case "watch":
      return "warning";
    default:
      return "muted";
  }
}

export function App() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [session, setSession] = useState<AuthSession | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [dashboardLoading, setDashboardLoading] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState<string | null>(null);
  const [dashboardError, setDashboardError] = useState<string | null>(null);

  useEffect(() => {
    setAuthLoading(false);
    return undefined;
  }, []);

  useEffect(() => {
    let active = true;

    async function refreshDashboard(): Promise<void> {
      if (!session) {
        if (active) {
          setData(null);
          setDashboardError(null);
        }
        return;
      }

      setDashboardLoading(true);
      setDashboardError(null);

      try {
        const next = await loadDashboardData();
        if (active) {
          setData(next);
        }
      } catch (error) {
        if (!active) {
          return;
        }

        if (error instanceof ApiError && error.status === 401) {
          clearAuthToken();
          setSession(null);
          setData(null);
          setAuthError("Session expired. Please sign in again.");
          return;
        }

        setDashboardError(error instanceof Error ? error.message : "Failed to load dashboard.");
        setData(null);
      } finally {
        if (active) {
          setDashboardLoading(false);
        }
      }
    }

    void refreshDashboard();

    return () => {
      active = false;
    };
  }, [session]);

  const summary = useMemo(() => {
    const devices = data?.devices ?? [];

    return {
      total: devices.length,
      online: devices.filter((device) => device.status === "online").length,
      degraded: devices.filter((device) => device.status === "degraded").length,
      alerts: devices.reduce((count, device) => count + device.activeAlerts, 0)
    };
  }, [data]);

  const sourceLabel = data?.source === "live" ? "Live API" : "Mock data";

  async function handleLogin(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setAuthError(null);
    setAuthLoading(true);

    try {
      const nextSession = await login(username, password);
      storeAuthToken(nextSession.token);
      setSession(nextSession);
      setPassword("");
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : "Login failed.");
    } finally {
      setAuthLoading(false);
    }
  }

  async function handleLogout(): Promise<void> {
    try {
      await logout();
    } catch {
      // Logout should still clear local session state.
    } finally {
      clearAuthToken();
      setSession(null);
      setData(null);
      setUsername("");
      setPassword("");
    }
  }

  if (!session) {
    return (
      <main className="auth-shell">
        <section className="auth-card">
          <p className="eyebrow">Plant-Management</p>
          <h1>Sign in to the operator control plane.</h1>
          <p className="lede">
            Device inventory, commands, and telemetry are now protected behind authenticated access.
          </p>

          <form className="auth-form" onSubmit={(event) => void handleLogin(event)}>
            <label className="field">
              <span>Username</span>
              <input
                autoComplete="username"
                disabled={authLoading}
                onChange={(event) => setUsername(event.target.value)}
                value={username}
              />
            </label>

            <label className="field">
              <span>Password</span>
              <input
                autoComplete="current-password"
                disabled={authLoading}
                onChange={(event) => setPassword(event.target.value)}
                type="password"
                value={password}
              />
            </label>

            {authError ? <p className="error-text">{authError}</p> : null}
            {authLoading ? <p className="muted-text">Signing in…</p> : null}

            <button className="primary-button" disabled={authLoading || username.length === 0 || password.length === 0} type="submit">
              Sign in
            </button>
          </form>
        </section>
      </main>
    );
  }

  return (
    <main className="shell">
      <section className="hero">
        <div>
          <p className="eyebrow">Plant-Management</p>
          <h1>Operator dashboard for plant devices, sensors, and watering control.</h1>
          <p className="lede">
            The platform starts as a standalone control plane. Devices, measurements, commands, and protocol contracts
            are visible here before any adaptive logic is added.
          </p>
        </div>
        <div className="hero-panel">
          <div className="hero-actions">
            <span className={`status-pill ${statusTone(data?.health.status ?? "ok")}`}>{sourceLabel}</span>
            <button className="ghost-button" onClick={() => void handleLogout()} type="button">
              Sign out
            </button>
          </div>
          <dl className="health-grid">
            <div>
              <dt>Backend</dt>
              <dd>{data?.health.service ?? "plant-management-backend"}</dd>
            </div>
            <div>
              <dt>Protocol</dt>
              <dd>{data?.health.protocolVersion ?? "0.1.0"}</dd>
            </div>
            <div>
              <dt>Database</dt>
              <dd>{data?.health.database ?? "not-configured"}</dd>
            </div>
            <div>
              <dt>User</dt>
              <dd>{session.username}</dd>
            </div>
            <div>
              <dt>Uptime</dt>
              <dd>{formatUptime(data?.health.uptimeSeconds ?? 0)}</dd>
            </div>
          </dl>
        </div>
      </section>

      {dashboardError ? <p className="banner warning-banner">{dashboardError}</p> : null}
      {dashboardLoading ? <p className="banner info-banner">Refreshing protected dashboard data…</p> : null}

      <section className="metrics">
        <article className="metric-card">
          <span className="metric-label">Devices</span>
          <strong>{summary.total}</strong>
        </article>
        <article className="metric-card">
          <span className="metric-label">Online</span>
          <strong>{summary.online}</strong>
        </article>
        <article className="metric-card">
          <span className="metric-label">Degraded</span>
          <strong>{summary.degraded}</strong>
        </article>
        <article className="metric-card">
          <span className="metric-label">Alerts</span>
          <strong>{summary.alerts}</strong>
        </article>
      </section>

      <section className="content-grid">
        <article className="panel panel-wide">
          <div className="panel-header">
            <div>
              <p className="section-label">Devices</p>
              <h2>Inventory and live status</h2>
            </div>
            <span className="meta">Fetched {formatTime(data?.fetchedAt ?? new Date().toISOString())}</span>
          </div>

          <div className="device-list">
            {(data?.devices ?? []).map((device) => (
              <article className="device-card" key={device.id}>
                <div className="device-head">
                  <div>
                    <h3>{device.name}</h3>
                    <p>
                      {device.location.room} • {device.location.zone}
                    </p>
                  </div>
                  <span className={`status-pill ${statusTone(device.status)}`}>{device.status}</span>
                </div>

                <dl className="device-details">
                  <div>
                    <dt>Role</dt>
                    <dd>{device.role}</dd>
                  </div>
                  <div>
                    <dt>Firmware</dt>
                    <dd>{device.firmwareVersion}</dd>
                  </div>
                  <div>
                    <dt>Last seen</dt>
                    <dd>{formatTime(device.lastSeenAt)}</dd>
                  </div>
                  <div>
                    <dt>Alerts</dt>
                    <dd>{device.activeAlerts}</dd>
                  </div>
                </dl>

                <div className="capability-row">
                  {device.capabilities.map((capability) => (
                    <span className="capability" key={capability}>
                      {capability}
                    </span>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </article>

        <aside className="panel">
          <div className="panel-header">
            <div>
              <p className="section-label">Protocol</p>
              <h2>HTTP and MQTT contract</h2>
            </div>
          </div>

          <div className="protocol-block">
            <h3>HTTP endpoints</h3>
            <ul>
              {(data?.protocol.httpEndpoints ?? []).map((endpoint) => (
                <li key={endpoint}>{endpoint}</li>
              ))}
            </ul>
          </div>

          <div className="protocol-block">
            <h3>MQTT topics</h3>
            <ul>
              {Object.entries(data?.protocol.mqttTopics ?? {}).map(([key, value]) => (
                <li key={key}>
                  <span>{key}</span>
                  <code>{value}</code>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </section>

      <section className="content-grid secondary-grid">
        <article className="panel">
          <div className="panel-header">
            <div>
              <p className="section-label">Plants</p>
              <h2>Assigned cultivation targets</h2>
            </div>
          </div>

          <div className="stack-list">
            {(data?.plants ?? []).map((plant) => (
              <article className="device-card compact-card" key={plant.id}>
                <div className="device-head">
                  <div>
                    <h3>{plant.name}</h3>
                    <p>{plant.species}</p>
                  </div>
                  <span className={`status-pill ${statusTone(plant.status)}`}>{plant.status}</span>
                </div>

                <dl className="device-details">
                  <div>
                    <dt>Location</dt>
                    <dd>{plant.locationName}</dd>
                  </div>
                  <div>
                    <dt>Target</dt>
                    <dd>
                      {plant.moistureTargetPercent.min}% - {plant.moistureTargetPercent.max}%
                    </dd>
                  </div>
                  <div>
                    <dt>Substrate</dt>
                    <dd>{plant.substrate}</dd>
                  </div>
                  <div>
                    <dt>Devices</dt>
                    <dd>{plant.assignedDeviceIds.join(", ")}</dd>
                  </div>
                </dl>
              </article>
            ))}
          </div>
        </article>

        <article className="panel">
          <div className="panel-header">
            <div>
              <p className="section-label">Locations</p>
              <h2>Physical layout model</h2>
            </div>
          </div>

          <div className="stack-list">
            {(data?.locations ?? []).map((location) => (
              <article className="device-card compact-card" key={location.id}>
                <div className="device-head">
                  <div>
                    <h3>{location.name}</h3>
                    <p>
                      {location.room} • {location.zone}
                    </p>
                  </div>
                </div>

                <dl className="device-details">
                  <div>
                    <dt>Plants</dt>
                    <dd>{location.plantCount}</dd>
                  </div>
                  <div>
                    <dt>Devices</dt>
                    <dd>{location.deviceCount}</dd>
                  </div>
                </dl>
              </article>
            ))}
          </div>
        </article>
      </section>
    </main>
  );
}
