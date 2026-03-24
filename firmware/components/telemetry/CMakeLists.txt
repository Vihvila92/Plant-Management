idf_component_register(
    SRCS "pm_telemetry.c"
    INCLUDE_DIRS "include"
    REQUIRES esp_common device_state
)
