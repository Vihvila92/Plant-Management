# Documentation Index

This directory contains the product-level documentation for the current Plant-Management foundation.
It documents the standalone platform, operator authentication, backend/web responsibilities, deployment model, and the deferred Home Assistant integration path.

## Current Status

- The platform is a standalone monorepo with `backend`, `web`, `firmware`, and `docs`.
- The backend already exposes operator authentication, plant/location inventory, device inventory, command routing, and protocol visibility.
- The web app is an authenticated operator dashboard for managing the platform.
- Docker Compose is the local deployment shape for PostgreSQL, backend, and web.
- Home Assistant is intentionally deferred and will be treated as a dedicated integration later.

## Core Documents

- [Architecture](./architecture.md) - runtime boundaries, deployment shape, and current platform direction
- [API and Protocol Contract](./api-protocol.md) - public API and device-facing contract

## Documented TODOs

- Replace the in-memory backend repository with persistent storage and migrations.
- Move operator sessions to durable server-side storage.
- Add production-grade device provisioning and enrollment flow.
- Expand the firmware scaffold into real sensor, pump, and safety logic.
- Finish the Wokwi demo as a repeatable early-stage hardware simulation.
- Add the dedicated Home Assistant integration only after the platform contract has stabilized.
