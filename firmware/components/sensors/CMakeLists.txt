idf_component_register(
    SRCS "pm_sensors.c"
    INCLUDE_DIRS "include"
    REQUIRES driver esp_adc esp_rom
)
