idf_component_register(
    SRCS "app_main.c"
    INCLUDE_DIRS "."
    REQUIRES config device_state telemetry comm diagnostics ota protocol nvs_flash sensors
)
