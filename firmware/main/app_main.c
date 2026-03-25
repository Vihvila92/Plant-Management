#include <string.h>

#include "esp_err.h"
#include "esp_log.h"
#include "esp_system.h"
#include "freertos/FreeRTOS.h"
#include "freertos/task.h"
#include "nvs_flash.h"

#include "pm_comm.h"
#include "pm_config.h"
#include "pm_diagnostics.h"
#include "pm_device_state.h"
#include "pm_ota.h"
#include "pm_sensors.h"
#include "pm_telemetry.h"

static const char *TAG = "pm_main";

static esp_err_t pm_nvs_init(void)
{
    esp_err_t err = nvs_flash_init();
    if (err == ESP_ERR_NVS_NO_FREE_PAGES || err == ESP_ERR_NVS_NEW_VERSION_FOUND) {
        ESP_LOGW(TAG, "NVS needs erase, reinitializing");
        ESP_ERROR_CHECK(nvs_flash_erase());
        err = nvs_flash_init();
    }
    return err;
}

void app_main(void)
{
    ESP_ERROR_CHECK(pm_nvs_init());

    pm_config_t config;
    pm_device_state_t device_state;
    pm_boot_diagnostics_t diagnostics;
    esp_err_t security_status;
    pm_telemetry_sample_t boot_sample = {
        .kind         = PM_TELEMETRY_SAMPLE_KIND_SYSTEM,
        .channel      = "boot",
        .unit         = "event",
        .value        = 1.0f,
        .timestamp_ms = 0,
        .valid        = true,
    };

    ESP_ERROR_CHECK(pm_config_load(&config));
    security_status = pm_config_validate_security(&config);
    pm_device_state_init(&device_state);
    ESP_ERROR_CHECK(pm_diagnostics_init());
    ESP_ERROR_CHECK(pm_diagnostics_capture(&diagnostics));

    if (security_status == ESP_OK) {
        ESP_ERROR_CHECK(pm_ota_init());
        ESP_ERROR_CHECK(pm_comm_init(&config));
        ESP_ERROR_CHECK(pm_comm_start());
        pm_device_state_set_online(&device_state, true);
    } else {
        ESP_LOGE(TAG, "Device communication disabled until secure credentials are provisioned");
        pm_device_state_set_online(&device_state, false);
    }

    pm_device_state_update_heartbeat(&device_state, esp_log_timestamp());
    pm_device_state_set_health(&device_state,
        security_status == ESP_OK ? PM_DEVICE_HEALTH_OK : PM_DEVICE_HEALTH_WARN);

    ESP_LOGI(TAG, "Plant-Management firmware scaffold started");
    ESP_LOGI(TAG, "Device role: %s", config.device_role);
    ESP_LOGI(TAG, "MQTT TLS required: %s", config.require_tls ? "true" : "false");
    ESP_LOGI(TAG, "Reset reason: %s", diagnostics.reset_reason);

    boot_sample.timestamp_ms = esp_log_timestamp();
    ESP_ERROR_CHECK(pm_telemetry_publish_state(&device_state));
    ESP_ERROR_CHECK(pm_telemetry_publish_sample(&boot_sample));

    if (security_status == ESP_OK) {
        ESP_ERROR_CHECK(pm_comm_publish_heartbeat(&device_state));
        ESP_ERROR_CHECK(pm_ota_check_for_update(&config));
    }

    /* Sensor init — non-fatal so demo can run even if a sensor fails */
    if (pm_sensors_init() != ESP_OK) {
        ESP_LOGW(TAG, "Sensor init failed — telemetry will be unavailable");
    }

    /* Main sensing loop */
    while (1) {
        int64_t now = esp_log_timestamp();
        pm_dht22_reading_t dht  = {0};
        pm_soil_reading_t  soil = {0};

        if (pm_sensors_read_dht22(&dht) == ESP_OK) {
            pm_telemetry_sample_t temp_s = {
                .kind         = PM_TELEMETRY_SAMPLE_KIND_SENSOR,
                .channel      = "air-temperature",
                .unit         = "C",
                .value        = dht.temperature_c,
                .timestamp_ms = now,
                .valid        = dht.valid,
            };
            pm_telemetry_sample_t hum_s = {
                .kind         = PM_TELEMETRY_SAMPLE_KIND_SENSOR,
                .channel      = "air-humidity",
                .unit         = "%",
                .value        = dht.humidity_pct,
                .timestamp_ms = now,
                .valid        = dht.valid,
            };
            ESP_ERROR_CHECK(pm_telemetry_publish_sample(&temp_s));
            ESP_ERROR_CHECK(pm_telemetry_publish_sample(&hum_s));
        }

        if (pm_sensors_read_soil(&soil) == ESP_OK) {
            pm_telemetry_sample_t soil_s = {
                .kind         = PM_TELEMETRY_SAMPLE_KIND_SENSOR,
                .channel      = "soil-moisture",
                .unit         = "%",
                .value        = soil.moisture_pct,
                .timestamp_ms = now,
                .valid        = soil.valid,
            };
            ESP_ERROR_CHECK(pm_telemetry_publish_sample(&soil_s));

            /* Blink pump LED when soil is dry (< 30 %) */
            pm_sensors_set_pump_led(soil.moisture_pct < 30.0f);
        }

        vTaskDelay(pdMS_TO_TICKS(config.telemetry_interval_ms));
    }
}
