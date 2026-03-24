#include "esp_log.h"

#include "pm_ota.h"

static const char *TAG = "pm_ota";
static pm_ota_status_t s_status = PM_OTA_STATUS_IDLE;

esp_err_t pm_ota_init(void)
{
    s_status = PM_OTA_STATUS_IDLE;
    ESP_LOGI(TAG, "OTA boundary initialized");
    return ESP_OK;
}

esp_err_t pm_ota_check_for_update(const pm_config_t *config)
{
    if (config == NULL) {
        return ESP_ERR_INVALID_ARG;
    }

    if (!config->ota_enabled) {
        ESP_LOGI(TAG, "OTA disabled by configuration");
        s_status = PM_OTA_STATUS_IDLE;
        return ESP_OK;
    }

    ESP_LOGI(TAG, "OTA check stub executed for device_id=%s", config->device_id);
    s_status = PM_OTA_STATUS_READY;
    return ESP_OK;
}

esp_err_t pm_ota_apply_pending_update(void)
{
    ESP_LOGI(TAG, "OTA apply stub called");
    s_status = PM_OTA_STATUS_APPLYING;
    return ESP_OK;
}

pm_ota_status_t pm_ota_get_status(void)
{
    return s_status;
}
