# Architecture

Plant-Management is a standalone plant operations platform. It is the system of record for plants, locations, devices, measurements, watering commands, alerts, and automation policies.

## Current Status

- The repository is organized as a monorepo with `backend`, `web`, `firmware`, and `docs`.
- The backend provides operator authentication, domain storage for plants and locations, device inventory, command orchestration, and protocol visibility.
- The web application provides the authenticated operator UI for monitoring and administering the platform.
- Docker Compose is the current deployment model for local and self-hosted development.
- The firmware tree is scaffolded for ESP32-C3 and remains a separate implementation area.
- Home Assistant is intentionally deferred and is not part of the MVP runtime.

## Runtime Boundaries

- `backend` owns the system of record, operator auth, domain rules, persistence, and command routing.
- `web` owns the authenticated operator experience and reads the backend API.
- `firmware` owns the device-side implementation and must stay isolated from platform UI concerns.
- `docs` defines the product-level architecture and contract shape for the platform.

## Deployment Model

- PostgreSQL is the first persistent store.
- Backend and web run as separate services.
- Docker Compose is the default local deployment entrypoint.
- The platform is intended to run standalone on a Linux host, NAS, or server.

## Security Model

- Operator access is authenticated at the backend.
- The platform should fail closed when credentials or session configuration are missing.
- Device communication is treated as a separate trust boundary from operator access.
- The platform should not depend on Home Assistant for primary access control or device management.

## Data And Control Flow

1. Operators authenticate through the web application.
2. The web application calls the backend API for inventory, telemetry, and command operations.
3. The backend persists platform state and enforces domain rules.
4. Devices report telemetry and health updates to the platform.
5. Commands flow from the backend to devices through the device-facing transport layer.

## Home Assistant Position

- Home Assistant is a future integration target, not a core dependency.
- The platform must remain usable without Home Assistant.
- When integration is added later, it should consume stable backend APIs and domain events rather than replace the platform runtime.

## Documented TODOs

- Replace the in-memory backend repository with persistent storage and migrations.
- Move operator sessions to durable server-side storage.
- Complete the initial device onboarding and provisioning flow.
- Expand the firmware implementation from scaffold to actual sensor and pump control.
- Formalize the public integration surface before adding Home Assistant.
