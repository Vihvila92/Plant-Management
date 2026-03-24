#include "esp_log.h"

#include "pm_telemetry.h"

static const char *TAG = "pm_telemetry";

esp_err_t pm_telemetry_publish_sample(const pm_telemetry_sample_t *sample)
{
    if (sample == NULL || sample->channel == NULL || sample->unit == NULL) {
        return ESP_ERR_INVALID_ARG;
    }

    ESP_LOGI(TAG, "sample kind=%d channel=%s value=%.2f unit=%s valid=%s ts=%lld",
             (int)sample->kind,
             sample->channel,
             (double)sample->value,
             sample->unit,
             sample->valid ? "true" : "false",
             (long long)sample->timestamp_ms);
    return ESP_OK;
}

esp_err_t pm_telemetry_publish_state(const pm_device_state_t *state)
{
    if (state == NULL) {
        return ESP_ERR_INVALID_ARG;
    }

    ESP_LOGI(TAG, "state lifecycle=%d health=%d connected=%s boot_count=%u last_error=%u heartbeat=%lld",
             (int)state->lifecycle,
             (int)state->health,
             state->connected ? "true" : "false",
             (unsigned)state->boot_count,
             (unsigned)state->last_error_code,
             (long long)state->last_heartbeat_ms);
    return ESP_OK;
}
