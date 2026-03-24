#pragma once

#include <stdbool.h>
#include <stdint.h>

#include "esp_err.h"

typedef struct {
    char reset_reason[32];
    bool safe_mode;
    uint32_t boot_count;
} pm_boot_diagnostics_t;

esp_err_t pm_diagnostics_init(void);
esp_err_t pm_diagnostics_capture(pm_boot_diagnostics_t *diagnostics);
esp_err_t pm_diagnostics_log_event(const char *component, const char *event);
