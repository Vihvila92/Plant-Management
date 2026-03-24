idf_component_register(
    SRCS "pm_comm.c"
    INCLUDE_DIRS "include"
    REQUIRES esp_common config device_state telemetry protocol
)
