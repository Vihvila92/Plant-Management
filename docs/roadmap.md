# Roadmap

Planning document. Describes intended work, not implemented behavior.
Each item is sized to fit a single focused pull request.

Items are ordered within each phase by dependency.
Do not start a phase before the previous phase is stable on `develop`.

---

## Phase 0 — Tooling

Foundational quality tooling. Unblocks everything else.

- [ ] **0.1** Add ESLint with TypeScript and React rules to backend and web
- [ ] **0.2** Add Prettier, wire into ESLint as formatter, add `npm run format` script
- [ ] **0.3** Add lint step to CI workflow (`npm run lint`)
- [ ] **0.4** Fix backend build pipeline: configure `tsc` to emit JS into `dist/`, update backend Dockerfile to compile then run `node dist/index.js`
- [ ] **0.5** Add Vitest to backend, wire `npm run test` script and test step to CI

---

## Phase 1 — Persistence

Replace the in-memory repository with real PostgreSQL persistence.
Each repository is a separate PR to keep diffs reviewable.

- [ ] **1.1** Add `drizzle-orm` and `postgres` driver to backend dependencies
- [ ] **1.2** Define schema: `locations`, `plants`, `devices`, `channels` tables with initial migration
- [ ] **1.3** Define schema: `measurements`, `commands` tables with migration
- [ ] **1.4** Define schema: `sessions` table with migration (replaces in-memory session store)
- [ ] **1.5** Add migration runner to backend startup, add migration step to CI
- [ ] **1.6** Implement `PostgresLocationRepository`, replace in-memory, add tests
- [ ] **1.7** Implement `PostgresPlantRepository`, replace in-memory, add tests
- [ ] **1.8** Implement `PostgresDeviceRepository`, replace in-memory, add tests
- [ ] **1.9** Implement `PostgresCommandRepository`, replace in-memory, add tests
- [ ] **1.10** Implement persistent session store backed by `sessions` table, replace in-memory auth store
- [ ] **1.11** Remove all demo seed data from `repository.ts`, add optional dev-seed script
- [ ] **1.12** Update `docs/architecture.md` and `docs/api-protocol.md` to reflect persistence state

---

## Phase 2 — MQTT

Replace the stub MQTT transport with a real broker and client.

- [ ] **2.1** Add Mosquitto service to `docker-compose.yml` with basic config and health check
- [ ] **2.2** Add `mqtt` client library to backend, implement real `MqttTransport` replacing `StubMqttTransport`
- [ ] **2.3** Subscribe to `plants/v1/devices/+/telemetry` — store incoming measurements in DB
- [ ] **2.4** Subscribe to `plants/v1/devices/+/state` — update device status and `lastSeenAt` in DB
- [ ] **2.5** Subscribe to `plants/v1/devices/+/commands/+/events` — update command status (ACK, running, completed, failed)
- [ ] **2.6** Publish commands to `plants/v1/devices/{deviceId}/commands` on watering request
- [ ] **2.7** Publish desired config to `plants/v1/devices/{deviceId}/config/desired`
- [ ] **2.8** Update `docs/api-protocol.md` and `docs/protocol/mqtt-topics.md` to mark implemented topics as Canonical

---

## Phase 3 — Device Provisioning

First real path for registering and credentialing a device.

- [ ] **3.1** Design provisioning flow and document in `docs/protocol/provisioning.md`
- [ ] **3.2** Add `POST /api/devices` endpoint — registers a new device, returns device ID and credentials
- [ ] **3.3** Generate unique per-device MQTT credentials on registration
- [ ] **3.4** Add `GET /api/devices/:deviceId/provision` — returns provisioning payload for flashing
- [ ] **3.5** Store device credentials securely (hashed or via separate credential store)
- [ ] **3.6** Update `docs/api-protocol.md` with provisioning endpoints

---

## Phase 4 — Web Enhancements

Bring the operator UI up to reflect real backend capabilities as they land.

- [ ] **4.1** Device detail view — channels, recent measurements, pending commands
- [ ] **4.2** Manual watering command form — amount, reason, submit, show queued status
- [ ] **4.3** Command status tracking — live status updates via polling
- [ ] **4.4** Alert display — surface `activeAlerts` count with detail
- [ ] **4.5** Device provisioning UI — trigger provisioning, display credential payload
- [ ] **4.6** Dashboard auto-refresh — configurable polling interval, visible last-refreshed time
- [ ] **4.7** Error and empty states — explicit messaging when backend data is unavailable

---

## Phase 5 — Firmware: Real Implementation

Expand firmware from scaffold to real hardware behavior.
Read `firmware/ARCHITECTURE.md` and `firmware/TODO.md` before starting any item.

- [ ] **5.1** Real soil moisture sensor driver (ADC-based capacitive sensor)
- [ ] **5.2** Real temperature and humidity sensor driver (DHT22 or SHT3x)
- [ ] **5.3** Real pump control via GPIO with local safety enforcement (max run time, dry-run guard)
- [ ] **5.4** Real MQTT transport — connect with device credentials, TLS, broker verification
- [ ] **5.5** Telemetry publishing loop — periodic sensor readings to `telemetry` topic
- [ ] **5.6** Device state publishing — health summary to `state` topic on change and on schedule
- [ ] **5.7** Command subscription — receive and parse watering commands from `commands` topic
- [ ] **5.8** Command execution — run pump, publish ACK, running, and completed/failed events
- [ ] **5.9** Desired config subscription — apply configuration updates from `config/desired`
- [ ] **5.10** OTA update implementation — secure, verified, broker-authenticated
- [ ] **5.11** Provisioning state machine — refuse MQTT and OTA until credentials are valid
- [ ] **5.12** Wokwi simulation — update `diagram.json` and sim config to reflect real component wiring
- [ ] **5.13** Update `firmware/README.md`, `firmware/ARCHITECTURE.md`, and `firmware/TODO.md`

---

## Phase 6 — Automation

Policy-driven watering and alerting. Do not start before Phase 1 and Phase 2 are complete.

- [ ] **6.1** Define automation policy domain model and schema
- [ ] **6.2** `POST /api/policies` — create moisture threshold or schedule rule
- [ ] **6.3** `GET /api/policies` — list active policies
- [ ] **6.4** Policy evaluation loop — check moisture readings against thresholds, queue watering commands
- [ ] **6.5** Scheduled watering — cron-style rules, backend-side scheduling
- [ ] **6.6** Alert generation — create alerts when thresholds are breached or devices go offline
- [ ] **6.7** Alert resolution — mark alerts resolved when conditions clear
- [ ] **6.8** Document automation model in `docs/architecture.md`

---

## Phase 7 — Security Hardening

Tighten security posture before any public or shared deployment.

- [ ] **7.1** Replace wildcard CORS with explicit origin allowlist, make configurable via env
- [ ] **7.2** MQTT TLS configuration — document and test `mqtts://` setup with broker cert
- [ ] **7.3** Per-device credential rotation endpoint
- [ ] **7.4** Session hardening — expiry, revocation on password change, concurrent session limits
- [ ] **7.5** Document TLS and HTTPS setup for self-hosted deployment in `README.md`
- [ ] **7.6** Security review of provisioning credential handling

---

## Out Of Scope Until Explicitly Planned

- Home Assistant integration
- Multi-user IAM or RBAC
- Production fleet provisioning UX
- ML-based irrigation logic
- Mobile application

---

## Cross-Cutting Rules

- Every PR that changes API routes, MQTT topics, or payload shapes must update `docs/api-protocol.md` in the same PR.
- Every PR that changes firmware transport behavior must update `docs/protocol/` in the same PR.
- Scaffold vs. implemented status must remain honest in all docs at all times.
- Do not mark a phase complete until its persistence, test, and documentation items are done.
