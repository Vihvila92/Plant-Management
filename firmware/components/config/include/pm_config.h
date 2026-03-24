#pragma once

#include <stdbool.h>
#include <stdint.h>

#include "esp_err.h"

#define PM_DEVICE_ID_MAX_LEN 64
#define PM_DEVICE_ROLE_MAX_LEN 32
#define PM_MQTT_URI_MAX_LEN 128
#define PM_MQTT_CLIENT_ID_MAX_LEN 80
#define PM_FIRMWARE_VERSION_MAX_LEN 32
#define PM_DEVICE_TOKEN_MAX_LEN 128
#define PM_BROKER_FINGERPRINT_MAX_LEN 96
#define PM_TLS_SHA256_FINGERPRINT_LEN 64

typedef struct {
    char device_id[PM_DEVICE_ID_MAX_LEN];
    char device_role[PM_DEVICE_ROLE_MAX_LEN];
    char mqtt_broker_uri[PM_MQTT_URI_MAX_LEN];
    char mqtt_client_id[PM_MQTT_CLIENT_ID_MAX_LEN];
    char firmware_version[PM_FIRMWARE_VERSION_MAX_LEN];
    char device_token[PM_DEVICE_TOKEN_MAX_LEN];
    char broker_fingerprint[PM_BROKER_FINGERPRINT_MAX_LEN];
    uint32_t telemetry_interval_ms;
    uint32_t heartbeat_interval_ms;
    bool ota_enabled;
    bool manual_watering_enabled;
    bool require_tls;
    bool verify_server_certificate;
} pm_config_t;

void pm_config_set_defaults(pm_config_t *config);
esp_err_t pm_config_load(pm_config_t *config);
esp_err_t pm_config_save(const pm_config_t *config);
esp_err_t pm_config_validate_security(const pm_config_t *config);
