#pragma once

#include <stddef.h>

#include "esp_err.h"

#define PM_PROTOCOL_VERSION_MAJOR 1
#define PM_PROTOCOL_VERSION_MINOR 0
#define PM_PROTOCOL_TOPIC_PREFIX "plant-management/v1"

typedef enum {
    PM_COMMAND_MANUAL_WATER = 0,
    PM_COMMAND_SET_CONFIG,
    PM_COMMAND_TRIGGER_OTA,
    PM_COMMAND_PING,
} pm_command_type_t;

esp_err_t pm_protocol_build_topic(char *buffer, size_t buffer_len, const char *device_id, const char *suffix);
const char *pm_protocol_command_type_to_string(pm_command_type_t command_type);
