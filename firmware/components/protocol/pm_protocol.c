#include <stdio.h>

#include "pm_protocol.h"

esp_err_t pm_protocol_build_topic(char *buffer, size_t buffer_len, const char *device_id, const char *suffix)
{
    if (buffer == NULL || device_id == NULL || suffix == NULL || buffer_len == 0) {
        return ESP_ERR_INVALID_ARG;
    }

    int written = snprintf(buffer, buffer_len, "%s/%s/%s", PM_PROTOCOL_TOPIC_PREFIX, device_id, suffix);
    if (written < 0 || (size_t)written >= buffer_len) {
        return ESP_ERR_INVALID_SIZE;
    }

    return ESP_OK;
}

const char *pm_protocol_command_type_to_string(pm_command_type_t command_type)
{
    switch (command_type) {
    case PM_COMMAND_MANUAL_WATER:
        return "manual_water";
    case PM_COMMAND_SET_CONFIG:
        return "set_config";
    case PM_COMMAND_TRIGGER_OTA:
        return "trigger_ota";
    case PM_COMMAND_PING:
        return "ping";
    default:
        return "unknown";
    }
}
