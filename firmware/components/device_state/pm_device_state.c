#include <string.h>

#include "pm_device_state.h"

void pm_device_state_init(pm_device_state_t *state)
{
    if (state == NULL) {
        return;
    }

    memset(state, 0, sizeof(*state));
    state->lifecycle = PM_DEVICE_LIFECYCLE_BOOTING;
    state->health = PM_DEVICE_HEALTH_UNKNOWN;
    state->boot_count = 1;
}

void pm_device_state_set_online(pm_device_state_t *state, bool connected)
{
    if (state == NULL) {
        return;
    }

    state->connected = connected;
    state->lifecycle = connected ? PM_DEVICE_LIFECYCLE_ONLINE : PM_DEVICE_LIFECYCLE_OFFLINE;
}

void pm_device_state_update_heartbeat(pm_device_state_t *state, int64_t timestamp_ms)
{
    if (state == NULL) {
        return;
    }

    state->last_heartbeat_ms = timestamp_ms;
}

void pm_device_state_set_health(pm_device_state_t *state, pm_device_health_t health)
{
    if (state == NULL) {
        return;
    }

    state->health = health;
}

void pm_device_state_mark_error(pm_device_state_t *state, uint32_t error_code)
{
    if (state == NULL) {
        return;
    }

    state->last_error_code = error_code;
    state->health = PM_DEVICE_HEALTH_ERROR;
    state->lifecycle = PM_DEVICE_LIFECYCLE_ERROR;
}
