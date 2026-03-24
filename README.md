# Plant-Management

Standalone plant management platform for plant inventory, device management, telemetry, and controlled watering.

## Current Status

- The repository is now structured as a monorepo with `backend`, `web`, `firmware`, and `docs`.
- The backend provides operator authentication, device inventory, plant and location inventory, command routing, and protocol visibility.
- The web app provides an authenticated operator dashboard with live data and protocol inspection.
- The firmware tree targets `ESP32-C3` with ESP-IDF and is buildable as a scaffold.
- Docker Compose brings up PostgreSQL, backend, and web for local platform development.
- Home Assistant is intentionally deferred and will later be added as a dedicated integration, not as part of the MVP core.

## Repository Layout

- `backend/` platform API, auth, domain model, and device gateway foundation
- `web/` operator UI for authenticated operations and live status
- `firmware/` ESP32-C3 firmware scaffold and Wokwi simulation entrypoint
- `docs/` architecture and public contract documentation

## Quick Start

1. Install dependencies.

```bash
npm install
```

2. Start the platform UI and backend.

```bash
npm run dev
```

3. Open the UI at `http://localhost:5173`.
4. The backend listens on `http://localhost:4000`.

## Useful Commands

```bash
npm run dev:backend
npm run dev:web
npm run build
npm run check
docker compose up --build
```

## Authentication

The backend protects operator routes with bearer-token sessions.

Supported environment variables:

```bash
PM_ADMIN_USERNAME=admin
PM_ADMIN_PASSWORD=change-this
PM_ADMIN_PASSWORD_HASH=scrypt$your-salt$your-derived-hex
PM_SESSION_TTL_MS=43200000
PM_AUTH_MAX_ATTEMPTS=5
PM_AUTH_LOCKOUT_MS=900000
PM_TRUST_PROXY=false
```

If credentials are not configured, login is rejected until `PM_ADMIN_USERNAME` and either `PM_ADMIN_PASSWORD` or `PM_ADMIN_PASSWORD_HASH` are set.

## Firmware Notes

The firmware tree is structured for ESP-IDF and currently targets `ESP32-C3`.

Typical commands:

```bash
idf.py set-target esp32c3
idf.py build
idf.py flash
idf.py monitor
```

The firmware communication layer is secure-by-default and refuses to start MQTT or OTA without provisioned device credentials and broker verification material.

## Documented TODOs

- Replace the in-memory backend repository with persistent storage and migrations.
- Move operator session storage to a durable, server-side mechanism.
- Add the first real device provisioning flow for ESP32-C3 hardware.
- Expand the firmware from scaffold to real sensor and actuator drivers.
- Finish the Wokwi demo with live telemetry and pump simulation.
- Add the dedicated Home Assistant integration later, after the platform contract is stable.
