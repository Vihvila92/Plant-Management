# Plant-Management Firmware

Firmware for the Plant-Management system. This tree is the device-side runtime for the ESP32-C3 class nodes that will eventually control sensing, watering, diagnostics, and secure uplink communication.

## Current Status

### Verified

- The firmware builds successfully for `ESP32-C3` with ESP-IDF.
- NVS boot initialization is wired in.
- Device security validation blocks comms unless the runtime configuration is provisioned with non-placeholder credentials and a valid broker fingerprint.
- The project is aligned to a single firmware image model, where behavior is selected through configuration and capabilities.
- A Wokwi demo scaffold exists for boot flow and basic sensor/actuator visualization.

### Still Scaffold

- MQTT is only a communication boundary at this point, not a full production client implementation.
- OTA is a defined boundary, but update download, signing, rollback, and recovery are still incomplete.
- Real sensor drivers, pump control, provisioning UX, and calibration storage are not implemented yet.
- The current Wokwi wiring is a simulation aid, not a validated pinout for a physical SuperMini revision.

## Target Hardware

The intended physical target is `ESP32-C3 SuperMini`.

Important constraints:

- The repo is locked to `esp32c3` as the default IDF target.
- The current firmware scaffold does not depend on ESP32-only peripherals.
- The exact SuperMini pinout is not frozen yet.
- GPIO choices used in Wokwi must not be treated as production-safe wiring until the specific board revision has been verified.

## Firmware Modules

- `main/` boot orchestration and startup sequencing.
- `components/config/` runtime configuration model and security validation.
- `components/device_state/` lifecycle and health tracking.
- `components/telemetry/` telemetry sample and state publishing boundary.
- `components/comm/` MQTT communication boundary.
- `components/protocol/` topic naming and command helpers.
- `components/diagnostics/` boot and runtime diagnostics.
- `components/ota/` OTA lifecycle boundary.
- `sdkconfig.defaults` default IDF target and flash sizing for ESP32-C3.
- `diagram.json` and `wokwi.toml` Wokwi simulation entrypoint.

## Verified Boot Flow

The current `app_main` startup sequence is:

1. Initialize NVS.
2. Load default runtime configuration.
3. Validate the security posture of the configuration.
4. Initialize device state and capture boot diagnostics.
5. Start OTA and comms only if security validation passes.
6. Publish initial state and a boot telemetry sample.
7. Publish heartbeat and check for updates when secure connectivity is allowed.

That means the firmware currently fails closed for communication. If credentials or broker verification are not valid, device comms are intentionally disabled.

## Security Posture

The current firmware baseline is secure-by-default for comms:

- MQTT broker URIs must use `mqtts://`.
- TLS is required by default.
- Server certificate verification is required by default.
- Device credentials must not remain on placeholder values.
- The broker SHA-256 fingerprint must be provisioned and syntactically valid.
- Insecure development overrides are gated behind `PM_ALLOW_INSECURE_DEV_CONFIG`, which defaults to off.

This is a foundation, not the final security architecture. Secure provisioning, credential rotation, attestation, and OTA signing are still TODO.

## Build And Flash

From a shell where ESP-IDF is available:

```bash
source "/Users/valtteri vehvilainen/Omat Githubit/esp/esp-idf/export.sh"
cd "/Users/valtteri vehvilainen/Omat Githubit/Plant-Management/firmware"
idf.py set-target esp32c3
idf.py build
idf.py flash
idf.py monitor
```

Notes:

- `idf.py build` is the primary verification step for this repository right now.
- `idf.py flash` and `idf.py monitor` require connected hardware or a simulator/debug bridge.
- `firmware/build/` is generated output and is not source-of-truth documentation.

## Wokwi Demo

Wokwi is wired in for early demonstration work.

Current simulation setup:

- Board: `ESP32-C3 DevKitM-1` as the closest supported Wokwi board to the SuperMini family.
- `DHT22` on `GPIO4` for air temperature and humidity demo data.
- Potentiometer on `GPIO0` as a soil moisture stand-in.
- LED on `GPIO7` as a pump activity stand-in.
- `wokwi.toml` points to the ESP-IDF build artifacts and includes a local port forward for future MQTT-style demo work.

What this means:

- The simulation is useful for boot, state, and early telemetry demos.
- It is not yet a hardware-accurate validation of the final SuperMini pinout.
- The Wokwi wiring should be treated as disposable demo wiring until the real board mapping is confirmed.

## Documentation Boundaries

- `firmware/ARCHITECTURE.md` describes the firmware design and module boundaries.
- `firmware/TODO.md` tracks remaining firmware work explicitly.

## Implementation Notes

- The current implementation is intentionally small and explicit.
- Configuration, telemetry, protocol, and comms are separated to keep the backend contract evolvable.
- The firmware is still a scaffold: the boundaries are real, but most feature logic is not.
