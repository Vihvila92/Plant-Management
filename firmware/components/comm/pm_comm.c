#include "esp_log.h"

#include "pm_comm.h"
#include "pm_protocol.h"

static const char *TAG = "pm_comm";
static pm_config_t s_config;
static bool s_initialized;
static bool s_started;

esp_err_t pm_comm_init(const pm_config_t *config)
{
    if (config == NULL) {
        return ESP_ERR_INVALID_ARG;
    }

    esp_err_t security_validation_result = pm_config_validate_security(config);
    if (security_validation_result != ESP_OK) {
        ESP_LOGE(TAG, "Communication initialization rejected due to insecure configuration");
        return security_validation_result;
    }

    s_config = *config;
    s_initialized = true;
    ESP_LOGI(TAG, "Communication scaffold initialized for device_id=%s", s_config.device_id);
    return ESP_OK;
}

esp_err_t pm_comm_start(void)
{
    if (!s_initialized) {
        return ESP_ERR_INVALID_STATE;
    }

    s_started = true;
    ESP_LOGI(TAG, "MQTT client boundary ready for secure broker transport");
    return ESP_OK;
}

esp_err_t pm_comm_stop(void)
{
    if (!s_initialized) {
        return ESP_ERR_INVALID_STATE;
    }

    s_started = false;
    ESP_LOGI(TAG, "Communication scaffold stopped");
    return ESP_OK;
}

esp_err_t pm_comm_publish_heartbeat(const pm_device_state_t *state)
{
    if (!s_started || state == NULL) {
        return ESP_ERR_INVALID_STATE;
    }

    ESP_LOGI(TAG, "heartbeat publish stub for device_id=%s", s_config.device_id);
    return ESP_OK;
}

esp_err_t pm_comm_publish_measurement(const pm_telemetry_sample_t *sample)
{
    if (!s_started || sample == NULL) {
        return ESP_ERR_INVALID_STATE;
    }

    ESP_LOGI(TAG, "measurement publish stub channel=%s", sample->channel);
    return ESP_OK;
}

esp_err_t pm_comm_publish_command_result(const char *command_id, bool accepted, const char *detail)
{
    if (!s_started || command_id == NULL) {
        return ESP_ERR_INVALID_ARG;
    }

    ESP_LOGI(TAG, "command result stub command_id=%s accepted=%s detail=%s",
             command_id,
             accepted ? "true" : "false",
             detail != NULL ? detail : "");
    return ESP_OK;
}
