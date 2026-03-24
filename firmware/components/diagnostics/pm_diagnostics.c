#include <stdio.h>
#include <string.h>

#include "esp_log.h"
#include "esp_system.h"

#include "pm_diagnostics.h"

static const char *TAG = "pm_diag";
static bool s_initialized;

static const char *pm_reset_reason_to_string(esp_reset_reason_t reason)
{
    switch (reason) {
    case ESP_RST_POWERON:
        return "poweron";
    case ESP_RST_EXT:
        return "external";
    case ESP_RST_SW:
        return "software";
    case ESP_RST_PANIC:
        return "panic";
    case ESP_RST_INT_WDT:
        return "interrupt_wdt";
    case ESP_RST_TASK_WDT:
        return "task_wdt";
    case ESP_RST_WDT:
        return "other_wdt";
    case ESP_RST_DEEPSLEEP:
        return "deepsleep";
    case ESP_RST_BROWNOUT:
        return "brownout";
    default:
        return "unknown";
    }
}

esp_err_t pm_diagnostics_init(void)
{
    s_initialized = true;
    ESP_LOGI(TAG, "Diagnostics scaffold initialized");
    return ESP_OK;
}

esp_err_t pm_diagnostics_capture(pm_boot_diagnostics_t *diagnostics)
{
    if (!s_initialized || diagnostics == NULL) {
        return ESP_ERR_INVALID_STATE;
    }

    memset(diagnostics, 0, sizeof(*diagnostics));
    snprintf(diagnostics->reset_reason, sizeof(diagnostics->reset_reason), "%s",
             pm_reset_reason_to_string(esp_reset_reason()));
    diagnostics->safe_mode = false;
    diagnostics->boot_count = 1;
    return ESP_OK;
}

esp_err_t pm_diagnostics_log_event(const char *component, const char *event)
{
    if (component == NULL || event == NULL) {
        return ESP_ERR_INVALID_ARG;
    }

    ESP_LOGI(TAG, "[%s] %s", component, event);
    return ESP_OK;
}
