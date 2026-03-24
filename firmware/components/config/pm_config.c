#include <stdio.h>
#include <string.h>

#include "esp_log.h"

#include "pm_config.h"

static const char *TAG = "pm_config";
static const char *PM_DEFAULT_DEVICE_TOKEN = "CHANGE_ME_WITH_UNIQUE_DEVICE_TOKEN";
static const char *PM_DEFAULT_BROKER_FINGERPRINT = "CHANGE_ME_WITH_BROKER_SHA256_FINGERPRINT";
#ifndef PM_ALLOW_INSECURE_DEV_CONFIG
#define PM_ALLOW_INSECURE_DEV_CONFIG 0
#endif

static bool pm_is_hex_character(char value)
{
    return (value >= '0' && value <= '9') ||
           (value >= 'a' && value <= 'f') ||
           (value >= 'A' && value <= 'F');
}

static bool pm_is_valid_sha256_fingerprint(const char *value)
{
    size_t index;

    if (value == NULL || strlen(value) != PM_TLS_SHA256_FINGERPRINT_LEN) {
        return false;
    }

    for (index = 0; index < PM_TLS_SHA256_FINGERPRINT_LEN; ++index) {
        if (!pm_is_hex_character(value[index])) {
            return false;
        }
    }

    return true;
}

void pm_config_set_defaults(pm_config_t *config)
{
    if (config == NULL) {
        return;
    }

    memset(config, 0, sizeof(*config));
    snprintf(config->device_id, sizeof(config->device_id), "pm-esp32c3-001");
    snprintf(config->device_role, sizeof(config->device_role), "sensor-node");
    snprintf(config->mqtt_broker_uri, sizeof(config->mqtt_broker_uri), "mqtts://plant-management.local:8883");
    snprintf(config->mqtt_client_id, sizeof(config->mqtt_client_id), "pm-esp32c3-001");
    snprintf(config->firmware_version, sizeof(config->firmware_version), "0.1.0-dev");
    snprintf(config->device_token, sizeof(config->device_token), "%s", PM_DEFAULT_DEVICE_TOKEN);
    snprintf(config->broker_fingerprint, sizeof(config->broker_fingerprint), "%s", PM_DEFAULT_BROKER_FINGERPRINT);
    config->telemetry_interval_ms = 30000;
    config->heartbeat_interval_ms = 10000;
    config->ota_enabled = true;
    config->manual_watering_enabled = false;
    config->require_tls = true;
    config->verify_server_certificate = true;
}

esp_err_t pm_config_load(pm_config_t *config)
{
    if (config == NULL) {
        return ESP_ERR_INVALID_ARG;
    }

    pm_config_set_defaults(config);
    ESP_LOGI(TAG, "Loaded default device configuration scaffold");
    return ESP_OK;
}

esp_err_t pm_config_save(const pm_config_t *config)
{
    if (config == NULL) {
        return ESP_ERR_INVALID_ARG;
    }

    ESP_LOGI(TAG, "Configuration save stub called for device_id=%s", config->device_id);
    return ESP_OK;
}

esp_err_t pm_config_validate_security(const pm_config_t *config)
{
    if (config == NULL) {
        return ESP_ERR_INVALID_ARG;
    }

    if (config->require_tls && strncmp(config->mqtt_broker_uri, "mqtts://", strlen("mqtts://")) != 0) {
        ESP_LOGE(TAG, "Rejected insecure broker URI for device_id=%s", config->device_id);
        return ESP_ERR_INVALID_STATE;
    }

#if !PM_ALLOW_INSECURE_DEV_CONFIG
    if (!config->require_tls) {
        ESP_LOGE(TAG, "TLS is required for device connectivity");
        return ESP_ERR_INVALID_STATE;
    }

    if (!config->verify_server_certificate) {
        ESP_LOGE(TAG, "Broker certificate verification is required");
        return ESP_ERR_INVALID_STATE;
    }

    if (strncmp(config->device_token, PM_DEFAULT_DEVICE_TOKEN, sizeof(config->device_token)) == 0) {
        ESP_LOGE(TAG, "Device credentials are not provisioned");
        return ESP_ERR_INVALID_STATE;
    }

    if (strncmp(config->broker_fingerprint, PM_DEFAULT_BROKER_FINGERPRINT, sizeof(config->broker_fingerprint)) == 0) {
        ESP_LOGE(TAG, "Broker fingerprint is not provisioned");
        return ESP_ERR_INVALID_STATE;
    }
#endif

    if (strlen(config->device_token) < 24) {
        ESP_LOGE(TAG, "Device token is too short");
        return ESP_ERR_INVALID_STATE;
    }

    if (config->verify_server_certificate && !pm_is_valid_sha256_fingerprint(config->broker_fingerprint)) {
        ESP_LOGE(TAG, "Broker fingerprint format is invalid");
        return ESP_ERR_INVALID_STATE;
    }

    return ESP_OK;
}
