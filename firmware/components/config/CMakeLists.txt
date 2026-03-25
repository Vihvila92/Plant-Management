idf_component_register(
    SRCS "pm_config.c"
    INCLUDE_DIRS "include"
    REQUIRES esp_common
)

target_compile_definitions(${COMPONENT_LIB} PRIVATE PM_ALLOW_INSECURE_DEV_CONFIG=1)
