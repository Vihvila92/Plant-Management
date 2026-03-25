#include <string.h>

#include "esp_adc/adc_oneshot.h"
#include "esp_log.h"
#include "esp_rom_sys.h"
#include "driver/gpio.h"
#include "freertos/FreeRTOS.h"
#include "freertos/task.h"

#include "pm_sensors.h"

static const char *TAG = "pm_sensors";

#define DHT22_GPIO       ((gpio_num_t)PM_SENSOR_DHT22_GPIO)
#define SOIL_ADC_CHANNEL ADC_CHANNEL_0   /* GPIO0 = ADC1_CH0 on ESP32-C3 */
#define PUMP_LED_GPIO    ((gpio_num_t)PM_SENSOR_PUMP_LED_GPIO)

/* Timeout constants (µs) */
#define DHT22_RESPONSE_TIMEOUT_US  100
#define DHT22_BIT_LOW_TIMEOUT_US    75
#define DHT22_BIT_HIGH_TIMEOUT_US   80

static adc_oneshot_unit_handle_t s_adc;
static bool s_initialized;

/* ---------------------------------------------------------------------------
 * DHT22 bit-bang driver
 * -------------------------------------------------------------------------*/

static int dht22_await_level(int level, int timeout_us)
{
    int elapsed = 0;
    while (gpio_get_level(DHT22_GPIO) != level) {
        if (elapsed >= timeout_us) {
            return -1;
        }
        esp_rom_delay_us(1);
        elapsed++;
    }
    return elapsed;
}

static esp_err_t dht22_read_raw(float *temp, float *humidity)
{
    uint8_t data[5] = {0};

    /* Send start signal: pull low ≥18 ms then release */
    gpio_set_direction(DHT22_GPIO, GPIO_MODE_OUTPUT_OD);
    gpio_set_pull_mode(DHT22_GPIO, GPIO_PULLUP_ONLY);
    gpio_set_level(DHT22_GPIO, 0);
    vTaskDelay(pdMS_TO_TICKS(20));
    gpio_set_level(DHT22_GPIO, 1);
    esp_rom_delay_us(40);
    gpio_set_direction(DHT22_GPIO, GPIO_MODE_INPUT);

    /* DHT22 response: 80 µs low → 80 µs high */
    if (dht22_await_level(0, DHT22_RESPONSE_TIMEOUT_US) < 0) return ESP_ERR_TIMEOUT;
    if (dht22_await_level(1, DHT22_RESPONSE_TIMEOUT_US) < 0) return ESP_ERR_TIMEOUT;
    if (dht22_await_level(0, DHT22_RESPONSE_TIMEOUT_US) < 0) return ESP_ERR_TIMEOUT;

    /* Read 40 data bits */
    for (int i = 0; i < 40; i++) {
        /* Wait for the 50 µs low preamble to end */
        if (dht22_await_level(1, DHT22_BIT_LOW_TIMEOUT_US) < 0) return ESP_ERR_TIMEOUT;

        /* Sample at 40 µs: 0-bit high is ~28 µs, 1-bit high is ~70 µs */
        esp_rom_delay_us(40);
        data[i / 8] <<= 1;
        if (gpio_get_level(DHT22_GPIO)) {
            data[i / 8] |= 1;
        }

        /* Drain remaining high time */
        if (dht22_await_level(0, DHT22_BIT_HIGH_TIMEOUT_US) < 0) return ESP_ERR_TIMEOUT;
    }

    /* Checksum */
    if (((data[0] + data[1] + data[2] + data[3]) & 0xFF) != data[4]) {
        ESP_LOGW(TAG, "DHT22 checksum mismatch (calc=%u got=%u)", (data[0]+data[1]+data[2]+data[3])&0xFF, data[4]);
        return ESP_ERR_INVALID_CRC;
    }

    *humidity    = ((uint16_t)(data[0] << 8) | data[1]) * 0.1f;
    uint16_t raw = ((uint16_t)((data[2] & 0x7F) << 8)) | data[3];
    *temp        = raw * 0.1f;
    if (data[2] & 0x80) {
        *temp = -*temp;
    }

    return ESP_OK;
}

/* ---------------------------------------------------------------------------
 * Public API
 * -------------------------------------------------------------------------*/

esp_err_t pm_sensors_init(void)
{
    /* Pump LED */
    gpio_config_t led_cfg = {
        .pin_bit_mask  = (1ULL << PUMP_LED_GPIO),
        .mode          = GPIO_MODE_OUTPUT,
        .pull_up_en    = GPIO_PULLUP_DISABLE,
        .pull_down_en  = GPIO_PULLDOWN_DISABLE,
        .intr_type     = GPIO_INTR_DISABLE,
    };
    ESP_ERROR_CHECK(gpio_config(&led_cfg));
    gpio_set_level(PUMP_LED_GPIO, 0);

    /* DHT22 data line: input with pull-up, driver switches direction on read */
    gpio_set_direction(DHT22_GPIO, GPIO_MODE_INPUT);
    gpio_set_pull_mode(DHT22_GPIO, GPIO_PULLUP_ONLY);

    /* ADC for soil moisture (GPIO0 = ADC1_CH0) */
    adc_oneshot_unit_init_cfg_t adc_cfg = { .unit_id = ADC_UNIT_1 };
    ESP_ERROR_CHECK(adc_oneshot_new_unit(&adc_cfg, &s_adc));

    adc_oneshot_chan_cfg_t ch_cfg = {
        .bitwidth = ADC_BITWIDTH_DEFAULT,
        .atten    = ADC_ATTEN_DB_12,
    };
    ESP_ERROR_CHECK(adc_oneshot_config_channel(s_adc, SOIL_ADC_CHANNEL, &ch_cfg));

    s_initialized = true;
    ESP_LOGI(TAG, "Sensors ready — DHT22=GPIO%d  soil=GPIO%d  pump-led=GPIO%d",
             PM_SENSOR_DHT22_GPIO, PM_SENSOR_SOIL_ADC_GPIO, PM_SENSOR_PUMP_LED_GPIO);
    return ESP_OK;
}

esp_err_t pm_sensors_read_dht22(pm_dht22_reading_t *out)
{
    if (!s_initialized || out == NULL) {
        return ESP_ERR_INVALID_STATE;
    }

    memset(out, 0, sizeof(*out));
    esp_err_t err = dht22_read_raw(&out->temperature_c, &out->humidity_pct);
    out->valid = (err == ESP_OK);

    if (err != ESP_OK) {
        ESP_LOGW(TAG, "DHT22 read error: %s", esp_err_to_name(err));
    }
    return err;
}

esp_err_t pm_sensors_read_soil(pm_soil_reading_t *out)
{
    if (!s_initialized || out == NULL) {
        return ESP_ERR_INVALID_STATE;
    }

    int raw = 0;
    esp_err_t err = adc_oneshot_read(s_adc, SOIL_ADC_CHANNEL, &raw);
    if (err != ESP_OK) {
        out->valid = false;
        return err;
    }

    out->raw_adc      = raw;
    out->moisture_pct = (raw / 4095.0f) * 100.0f;
    out->valid        = true;
    return ESP_OK;
}

esp_err_t pm_sensors_set_pump_led(bool on)
{
    if (!s_initialized) {
        return ESP_ERR_INVALID_STATE;
    }
    gpio_set_level(PUMP_LED_GPIO, on ? 1 : 0);
    return ESP_OK;
}
