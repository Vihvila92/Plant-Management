#pragma once

#include "esp_err.h"

#include "pm_config.h"

typedef enum {
    PM_OTA_STATUS_IDLE = 0,
    PM_OTA_STATUS_READY,
    PM_OTA_STATUS_APPLYING,
    PM_OTA_STATUS_FAILED,
} pm_ota_status_t;

esp_err_t pm_ota_init(void);
esp_err_t pm_ota_check_for_update(const pm_config_t *config);
esp_err_t pm_ota_apply_pending_update(void);
pm_ota_status_t pm_ota_get_status(void);
