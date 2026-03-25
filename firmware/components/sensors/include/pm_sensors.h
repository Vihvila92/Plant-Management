#pragma once

#include <stdbool.h>
#include "esp_err.h"

/* GPIO assignments for Wokwi demo (not production-validated) */
#define PM_SENSOR_DHT22_GPIO      4   /* air temperature + humidity */
#define PM_SENSOR_SOIL_ADC_GPIO   0   /* soil moisture (potentiometer) */
#define PM_SENSOR_PUMP_LED_GPIO   7   /* pump activity indicator */

typedef struct {
    float temperature_c;
    float humidity_pct;
    bool  valid;
} pm_dht22_reading_t;

typedef struct {
    int   raw_adc;
    float moisture_pct;
    bool  valid;
} pm_soil_reading_t;

esp_err_t pm_sensors_init(void);
esp_err_t pm_sensors_read_dht22(pm_dht22_reading_t *out);
esp_err_t pm_sensors_read_soil(pm_soil_reading_t *out);
esp_err_t pm_sensors_set_pump_led(bool on);
