#pragma once

#include "esp_err.h"

#include "pm_config.h"
#include "pm_device_state.h"
#include "pm_telemetry.h"

esp_err_t pm_comm_init(const pm_config_t *config);
esp_err_t pm_comm_start(void);
esp_err_t pm_comm_stop(void);
esp_err_t pm_comm_publish_heartbeat(const pm_device_state_t *state);
esp_err_t pm_comm_publish_measurement(const pm_telemetry_sample_t *sample);
esp_err_t pm_comm_publish_command_result(const char *command_id, bool accepted, const char *detail);
