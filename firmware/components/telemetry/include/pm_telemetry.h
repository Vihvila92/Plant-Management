#pragma once

#include <stdbool.h>
#include <stdint.h>

#include "esp_err.h"

#include "pm_device_state.h"

typedef enum {
    PM_TELEMETRY_SAMPLE_KIND_SENSOR = 0,
    PM_TELEMETRY_SAMPLE_KIND_SYSTEM,
    PM_TELEMETRY_SAMPLE_KIND_ACTUATOR,
} pm_telemetry_sample_kind_t;

typedef struct {
    pm_telemetry_sample_kind_t kind;
    const char *channel;
    const char *unit;
    float value;
    int64_t timestamp_ms;
    bool valid;
} pm_telemetry_sample_t;

esp_err_t pm_telemetry_publish_sample(const pm_telemetry_sample_t *sample);
esp_err_t pm_telemetry_publish_state(const pm_device_state_t *state);
