# AGENTS.md

This file defines how AI coding agents must operate in the Plant-Management repository.
These rules apply repository-wide unless a deeper `AGENTS.md` overrides them for a subdirectory.

## Mission

Plant-Management is a standalone plant operations platform.
It is the system of record for:

- plants
- locations
- devices
- measurements
- watering commands
- alerts
- automation policies

Home Assistant is intentionally outside the MVP runtime.
When Home Assistant support is added later, it must be implemented as a dedicated integration against stable backend APIs and domain events.

## Current Stack

- `backend/`: TypeScript backend for auth, API, domain logic, persistence, and command orchestration
- `web/`: TypeScript operator UI
- `firmware/`: ESP-IDF firmware for `ESP32-C3`
- `docs/`: architecture, protocol, and product documentation
- device transport: `MQTT`
- persistence target: `PostgreSQL`
- physical target direction: `ESP32-C3 SuperMini`
- simulation aid: `Wokwi`

## Operating Principles

- Keep the platform standalone.
- Keep backend, web, firmware, and protocol boundaries explicit.
- Treat the backend as the source of truth.
- Keep one firmware image model whenever practical.
- Prefer additive protocol evolution.
- Fail closed by default.
- Document reality, not intention.

## Hard Constraints

- Do not make Home Assistant a runtime dependency.
- Do not add fallback default credentials for operators or devices.
- Do not weaken TLS, broker verification, auth, command safety, or OTA trust for convenience.
- Do not describe scaffold features as implemented.
- Do not invent undocumented transport fields, route shapes, or topic names.
- Do not silently replace real backend behavior with mocks on authenticated flows.
- Do not revert user changes in a dirty worktree unless explicitly asked.

## Code Clarity Policy

- Prefer code that is easy to read, review, and maintain over code that is merely short.
- Prefer explicit segmentation of logic into coherent functions, modules, and boundaries rather than large mixed-responsibility blocks.
- Prefer slightly too much structural clarity over too little, as long as it remains professionally disciplined.
- Comments are encouraged when they explain intent, constraints, invariants, safety assumptions, protocol rules, or non-obvious control flow.
- Do not add filler comments that only restate the next line of code.
- Segment code along real responsibilities, not artificial micro-fragments.
- If a module is scaffold-only, say so clearly in code comments or docs where that status matters.

## Required Reading

Before changing behavior, read the documents that define that area.

Always read first:

- `README.md`
- `docs/architecture.md`
- `docs/api-protocol.md`

Read additionally when relevant:

- firmware work:
  - `firmware/README.md`
  - `firmware/ARCHITECTURE.md`
  - `firmware/TODO.md`
- protocol or transport work:
  - `docs/protocol/README.md`
  - `docs/protocol/mqtt-topics.md`
  - `docs/protocol/messages.md`
  - relevant files in `docs/protocol/schemas/`

If a task changes behavior without reading the governing docs first, the task is not being done correctly.

## Ownership Model

- `backend/` owns operator auth, API, domain rules, persistence, and command orchestration.
- `web/` owns the authenticated operator experience and API consumption.
- `firmware/` owns device runtime, local safety enforcement, provisioning state handling, and hardware-facing logic.
- `docs/` owns architecture, compatibility contracts, protocol definitions, and explicit TODO/state documentation.

## Source Of Truth Rules

- Plant, device inventory, command history, alerts, and automation policy belong to the backend domain model.
- Firmware owns local execution, device health, device safety enforcement, and device-side runtime state.
- The web is an operator console, not an authority on domain truth.
- Protocol docs own canonical topic names, payload shapes, transport versioning, and contract wording.
- If two files describe the same contract differently, that is a defect and must be resolved.

## Security Policy

- Auth must remain backend-enforced.
- Missing auth configuration must reject login rather than create fallback sessions.
- Operator auth and device auth are separate trust boundaries and must stay separate in both code and docs.
- Device communication must remain secure-by-default:
  - `mqtts://` expected for normal operation
  - broker verification required
  - unique per-device credentials required
  - invalid credentials or trust material must disable comms, not trigger insecure fallback
- Do not store secrets in committed config, docs, examples, comments, or tests.
- If a change improves convenience but weakens security posture, reject it and choose a safer design.

## Area-Specific Rules

### Backend

- Treat `docs/api-protocol.md` as a compatibility contract, not just documentation.
- Keep route shapes, auth requirements, error semantics, and payload fields versionable.
- Prefer explicit domain models over ad hoc blobs.
- Keep repository/storage details out of HTTP contracts.
- Keep auth/session persistence separate from plant/device domain persistence.
- Do not add temporary bypasses to authenticated routes.
- Do not add undocumented response fields just to satisfy one UI view.
- If a backend change affects device-facing payloads or transport semantics, involve protocol/docs ownership.

### Web

- The web app is an operator console for real platform behavior, not a demo shell.
- Reflect real backend errors clearly.
- Do not hide backend failures behind optimistic placeholders, mock data, or silent success states.
- Do not move trust decisions into the client.
- Keep auth state handling explicit and minimal.
- Avoid coupling UI logic to storage or repository internals.
- UI changes should follow real workflows:
  - devices
  - telemetry
  - commands
  - plants
  - locations
  - alerts

### Firmware

- Assume `esp32c3` unless the repository is intentionally expanded.
- Preserve secure boot-time gating.
- Do not allow MQTT, OTA, or command execution to start when provisioning state, credentials, or trust anchors are invalid.
- Keep pump safety local and hard-enforced.
- Do not derive production pinout truth from Wokwi.
- Do not scatter board pin definitions across files.
- Keep config, device state, comms, protocol, telemetry, diagnostics, and OTA concerns separated.
- Avoid ESP32-only assumptions that do not hold for `ESP32-C3`.
- Review strapping and boot-sensitive pins before pin changes.
- If transport fields, topic shapes, provisioning semantics, or OTA contract details need to change, stop treating the work as firmware-only and involve protocol/docs ownership.

### Protocol And Docs

- `docs/api-protocol.md` is the compatibility anchor for HTTP API and top-level protocol status.
- `docs/protocol/**` owns device-facing transport details.
- The canonical MQTT namespace is `plants/v1/devices/{deviceId}/`.
- Breaking changes require a new route, topic namespace, or schema version.
- Additive changes inside `v1` are allowed only when old consumers remain valid.
- Use `camelCase` consistently in transport contracts, examples, schemas, backend payloads, and firmware assumptions unless a compatibility exception is documented.
- Mark protocol elements explicitly as `Canonical`, `Reserved`, `Draft`, or scaffold-only where relevant.
- Do not document parallel truths across files.
- Do not invent future topics, statuses, or flows just to make docs feel complete.

## Documentation Policy

Documentation updates are part of the change, not follow-up work.

Update the relevant docs in the same change when any of these change:

- setup or build workflow
- auth behavior
- API routes
- payload shapes
- MQTT topics
- command lifecycle
- firmware boot/security behavior
- current scaffold vs implemented status

Baseline documentation expectations:

- `README.md` stays the top-level entrypoint.
- `docs/architecture.md` stays aligned with actual runtime boundaries.
- `docs/api-protocol.md` stays aligned with backend/API behavior.
- `docs/protocol/**` stays aligned with transport contracts.
- `firmware/README.md`, `firmware/ARCHITECTURE.md`, and `firmware/TODO.md` stay aligned with firmware reality.

## Code Clarity Policy

Prefer code that is easier to read, review, and maintain, even if that means slightly more structure or commentary than the minimum.

Rules:

- prefer clear segmentation over dense monolithic files or functions
- prefer named helper functions and explicit boundaries over clever compactness
- prefer a few useful comments too many rather than too few when the logic is safety-sensitive, protocol-sensitive, or otherwise easy to misread
- comments must explain intent, constraints, invariants, ordering, or risk, not restate obvious syntax
- avoid filler comments and line-by-line narration of trivial code
- if a workflow, safety gate, or contract boundary is non-obvious, document it in code close to the implementation
- when in doubt, choose the more maintainable and more readable form, but keep it within professional engineering standards

This repository should bias toward well-segmented and sufficiently commented code, not toward minimalist code that becomes hard to maintain after the original author moves on.

## TODO Policy

- Important unfinished work must be explicit.
- Do not leave critical gaps implicit.
- Use documentation-level TODO sections for major unfinished capabilities.
- Use code-level TODO comments sparingly and only for real implementation gaps.
- If work moves from scaffold to implemented, update the matching TODO and status docs in the same change.

## Verification Policy

Run the strongest relevant verification that is realistically available.

Minimum expectations:

- backend:
  - relevant typecheck/build
  - relevant tests when available
- web:
  - relevant typecheck/build
  - confirm auth-sensitive flows still compile and align with API contracts
- firmware:
  - `idf.py build` for `esp32c3`
  - if boot, config, security, or protocol helpers changed, build verification is expected before completion
- protocol/docs:
  - consistency pass across all touched contract files
  - validate schemas when schema files changed

Always report clearly:

- what was verified
- what could not be verified
- why it could not be verified

Wokwi is a demo tool, not production hardware validation.

## Change Strategy

Use this order of operations:

1. Identify the owning area.
2. Read the governing docs.
3. Confirm whether the task crosses a contract boundary.
4. Split work by ownership if it spans multiple areas.
5. Make the smallest coherent change.
6. Verify it.
7. Update docs and TODO state.
8. Run a consistency pass before finishing.

Do not casually reshape architecture.
If a task changes a shared contract, define or validate the contract before implementation spreads.

## Subagent Policy

For substantial work, always create dedicated subagents by project area instead of treating the repository as one undifferentiated task.

Typical split:

- `firmware` subagent
- `backend` subagent
- `web` subagent
- `protocol/docs` subagent
- `docker steward` subagent
- `documentation steward` subagent
- `external reviewer` subagent

Rules:

- give each subagent explicit ownership
- avoid overlapping write scope unless coordination is intentional
- keep shared contract ownership explicit
- parent agent remains responsible for integration and final consistency review

The parent agent must not delegate away the architectural decisions that unblock the whole task.
Use subagents for bounded area work, not to avoid thinking through the design.

## Mandatory Subagent Prompt Content

Every substantial subagent prompt must include:

- the exact responsibility it owns
- the directories or files it may edit
- the directories or files it must not edit
- the boundaries it must preserve
- the security constraints relevant to that area
- the required docs it must read first
- the concrete deliverable expected
- whether it may add docs, tests, or both
- a reminder that it is not alone in the codebase and must not revert unrelated work

Do not use vague prompts like:

- "fix firmware"
- "update backend"
- "improve docs"

## Subagent Templates

Use these as the baseline shape for detailed prompts.

### Firmware Subagent Template

You own `firmware/**` and may update `firmware/README.md`, `firmware/ARCHITECTURE.md`, and `firmware/TODO.md` when needed. You must not edit backend, web, or canonical protocol files unless the task explicitly expands your scope. Read firmware docs first, then protocol docs if transport behavior is touched. Preserve secure boot-time gating, `esp32c3` assumptions, and local pump safety. Do not treat Wokwi wiring as production pinout truth. Deliver the smallest coherent firmware change plus any matching firmware doc updates. Do not revert unrelated work.

### Backend Subagent Template

You own `backend/**` and may update contract-facing docs only if the task explicitly grants that scope. You must not change web or firmware code unless the task explicitly expands your scope. Read `README.md`, `docs/architecture.md`, and `docs/api-protocol.md` first. Preserve fail-closed auth, explicit domain boundaries, and versionable API behavior. Do not add auth bypasses, undocumented payload drift, or storage-coupled route contracts. Deliver the smallest coherent backend change and report required contract/doc follow-up. Do not revert unrelated work.

### Web Subagent Template

You own `web/**` and may update UI-facing docs only if the task explicitly grants that scope. You must not change backend or firmware code unless the task explicitly expands your scope. Read `README.md`, `docs/architecture.md`, and `docs/api-protocol.md` first. Preserve backend-auth trust boundaries and show real backend behavior rather than hidden mock fallbacks. Do not invent product semantics not supported by backend/domain docs. Deliver the smallest coherent UI change and report any backend contract gaps you encounter. Do not revert unrelated work.

### Protocol/Docs Subagent Template

You own `docs/api-protocol.md`, `docs/protocol/**`, and related schema files. You may update adjacent top-level docs if the task explicitly grants that scope. Read the current API and protocol docs first, then inspect the relevant backend or firmware implementation as needed. Preserve canonical namespace ownership, versioning rules, `camelCase` field naming, and explicit `Canonical` versus `Reserved` versus scaffold status. Reconcile contradictions rather than documenting parallel truths. Deliver synchronized doc and schema updates with current limitations kept explicit. Do not revert unrelated work.

### Docker Steward Template

You own containerization and local orchestration quality for the current change. You may edit `docker-compose.yml`, Dockerfiles, container-related scripts, and setup documentation such as `README.md` and relevant docs when needed to keep the container/runtime story aligned with the implementation. You must not use Docker changes to paper over backend, web, or firmware design problems. Read `README.md`, `docs/architecture.md`, and the current Docker-related files first. Your job is to keep the Docker implementation professionally structured: sensible service boundaries, explicit env/config handling, correct dependency wiring, predictable startup behavior, reasonable health/readiness strategy, minimal unnecessary coupling, and documentation that matches reality. Do not add convenience hacks that make local containers work by hiding real application issues. Do not revert unrelated work.

### Documentation Steward Template

You own documentation completeness for the current change. You may edit `README.md`, `docs/**`, and area-specific documentation such as `firmware/README.md`, `firmware/ARCHITECTURE.md`, and `firmware/TODO.md` as needed to keep documentation aligned with implementation. You must not invent behavior that does not exist. Read the relevant architecture, protocol, and area docs first, then inspect the changed implementation. Your job is to ensure the change is documented to a professional engineering standard: current behavior, constraints, limitations, setup impact, security impact, and TODO state must remain explicit. Reconcile contradictions across docs instead of patching only one file. Do not revert unrelated work.

### External Reviewer Template

You act as an external reviewer of repository guidance and change hygiene. Your default job is not to implement features, but to inspect whether the current change or current repository state requires updates to `AGENTS.md`, ownership rules, verification policy, security policy, documentation policy, or subagent policy. You may edit `AGENTS.md` only when the review clearly shows the guidance is stale, incomplete, or contradicted by the project structure. Read `AGENTS.md`, `README.md`, `docs/architecture.md`, and the relevant area docs first. Your deliverable is a clear judgment: whether the current agent policy still fits, what changed in the project that triggers an update, and the minimal necessary adjustments. Do not make speculative policy churn and do not revert unrelated work.

## Cross-Area Coordination Triggers

Engage protocol/docs ownership when any of these change:

- API payloads visible to operators or devices
- MQTT topics
- telemetry field names
- command lifecycle semantics
- provisioning semantics
- OTA transport semantics
- JSON schemas
- auth semantics documented in `docs/api-protocol.md`

Engage firmware ownership when any of these change:

- device boot flow
- device security posture
- local actuator safety
- hardware pin mapping
- device runtime behavior

Engage backend ownership when any of these change:

- auth
- route semantics
- domain model
- persistence model
- command orchestration

Engage web ownership when any of these change:

- operator workflow
- auth presentation
- dashboard behavior
- client-side error handling

Engage documentation steward ownership when any of these change:

- setup or build workflow
- architecture boundaries
- auth behavior
- API routes or payload shapes
- MQTT topics or message schemas
- firmware boot, provisioning, security, or hardware assumptions
- TODO status
- scaffold versus implemented status

Engage docker steward ownership when any of these change:

- `docker-compose.yml`
- any Dockerfile or container entrypoint
- service startup or dependency wiring used by local orchestration
- env/config handling that affects containerized runs
- ports, volumes, healthchecks, or networking assumptions
- local deployment workflow in `README.md` or related docs
- a service is added, removed, split, or merged in the containerized development stack

Engage external reviewer ownership when any of these change:

- a new permanent project area is introduced
- ownership boundaries between backend, web, firmware, docs, or integration layers change
- verification expectations change materially
- security posture or trust boundaries change materially
- subagent policy no longer matches the way work is being split
- the repository gains a new recurring workflow that agents should be required to follow
- `AGENTS.md` is contradicted by actual project structure or practice

The external reviewer should also be engaged periodically after larger architecture changes, not only after obvious breakage.

## Completion Criteria

A task is not complete unless:

- the change stays inside the correct ownership boundary or the cross-area boundary was handled explicitly
- relevant verification was run or the missing verification was stated clearly
- relevant docs were updated
- scaffold versus implemented status remains honest
- TODO state is updated when the task materially changes remaining work
- touched contracts are consistent across all files that define them
- the docker steward role has been satisfied when containerization or orchestration triggers apply
- the documentation steward role has been satisfied for any non-trivial change
- the external reviewer role has been satisfied when policy or project-shape triggers apply

## Docker Steward Requirement

There must be explicit ownership for Docker and local orchestration quality whenever container-related behavior changes.
That ownership should normally be assigned to the `docker steward` subagent.

Minimum responsibilities:

- keep container/service boundaries aligned with real application boundaries
- keep compose wiring understandable and minimal
- keep environment-variable usage explicit and documented
- avoid embedding secrets or unsafe defaults into container definitions
- avoid brittle startup ordering assumptions when a clearer dependency or health strategy is possible
- keep development convenience separate from production claims
- update setup and deployment docs when container behavior changes

The docker steward should optimize for maintainability and clarity, not for clever one-off local hacks.

## Documentation Steward Requirement

For any non-trivial change, there must be explicit ownership for documentation completeness.
That ownership should normally be assigned to the `documentation steward` subagent.

Minimum responsibilities:

- identify every doc affected by the change
- update those docs in the same change
- keep implementation status honest
- keep limitations, constraints, and TODOs explicit
- keep setup/build/security instructions aligned with reality
- bring the change up to a professional engineering documentation standard rather than leaving partial notes

Non-trivial change includes, at minimum:

- backend behavior changes
- web workflow changes
- firmware behavior changes
- protocol or schema changes
- auth or security changes
- build or setup changes
- architecture boundary changes

For tiny mechanical edits, the parent agent may satisfy this role directly, but that should be the exception rather than the default.

## External Reviewer Requirement

There must always be an external-review function for checking whether `AGENTS.md` still matches the repository.
That ownership should normally be assigned to the `external reviewer` subagent when the triggers below apply.

The external reviewer is responsible for asking:

- does the current `AGENTS.md` still match the actual project structure?
- have ownership boundaries changed?
- has the security model changed?
- has the verification policy changed?
- has the documentation policy changed?
- have new recurring workflows appeared that should be mandatory?
- is the current subagent model still sufficient?

Mandatory review triggers:

- new permanent subsystem or integration area
- major architecture refactor
- major security posture change
- substantial protocol governance change
- new test or release workflow that agents should follow by default
- repeated friction showing current instructions are too vague or too rigid
- any task that required agents to ignore or work around the current `AGENTS.md`

Periodic review guidance:

- review `AGENTS.md` after major milestones
- review it after introducing a new long-lived directory or service
- review it after changing how subagents are routinely assigned

The external reviewer should keep `AGENTS.md` current without causing policy churn.
If no trigger applies, leave the policy alone.

## Out Of Scope For Now

- Home Assistant runtime coupling
- ML-first irrigation logic
- multi-user IAM or enterprise auth flows
- production-grade fleet provisioning UX
- fully production-ready OTA pipeline

These may be added later, but agents must not assume they already exist.
