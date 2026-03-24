#pragma once

#include <stdbool.h>
#include <stdint.h>

typedef enum {
    PM_DEVICE_LIFECYCLE_BOOTING = 0,
    PM_DEVICE_LIFECYCLE_PROVISIONING,
    PM_DEVICE_LIFECYCLE_ONLINE,
    PM_DEVICE_LIFECYCLE_OFFLINE,
    PM_DEVICE_LIFECYCLE_ERROR,
} pm_device_lifecycle_t;

typedef enum {
    PM_DEVICE_HEALTH_UNKNOWN = 0,
    PM_DEVICE_HEALTH_OK,
    PM_DEVICE_HEALTH_WARN,
    PM_DEVICE_HEALTH_ERROR,
} pm_device_health_t;

typedef struct {
    pm_device_lifecycle_t lifecycle;
    pm_device_health_t health;
    uint32_t boot_count;
    uint32_t last_error_code;
    int64_t last_heartbeat_ms;
    bool connected;
} pm_device_state_t;

void pm_device_state_init(pm_device_state_t *state);
void pm_device_state_set_online(pm_device_state_t *state, bool connected);
void pm_device_state_update_heartbeat(pm_device_state_t *state, int64_t timestamp_ms);
void pm_device_state_set_health(pm_device_state_t *state, pm_device_health_t health);
void pm_device_state_mark_error(pm_device_state_t *state, uint32_t error_code);
