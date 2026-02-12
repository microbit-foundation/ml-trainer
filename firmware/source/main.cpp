/**
 * (c) 2023, Center for Computational Thinking and Design at Aarhus University and contributors
 * Modifications (c) 2024, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
#include "MicroBit.h"
#include "MicroBitAccelerometerService.h"
#include "MicroBitButtonService.h"

MicroBit uBit;

MicroBitAccelerometerService *accel;
MicroBitButtonService *btn;

int connected = 0;

const uint8_t CODEBOOK[MICROBIT_NAME_LENGTH][MICROBIT_NAME_CODE_LETTERS] = {
    {'z', 'v', 'g', 'p', 't'},
    {'u', 'o', 'i', 'e', 'a'},
    {'z', 'v', 'g', 'p', 't'},
    {'u', 'o', 'i', 'e', 'a'},
    {'z', 'v', 'g', 'p', 't'}
};

const char *const GLAD_SMILEY = "\
    000,000,000,000,000\n\
    000,070,000,070,000\n\
    000,000,000,000,000\n\
    070,000,000,000,070\n\
    000,070,070,070,000\n";

const char *const SAD_SMILEY = "\
    000,000,000,000,000\n\
    000,070,000,070,000\n\
    000,000,000,000,000\n\
    000,070,070,070,000\n\
    070,000,000,000,070\n";

void printSmiley(const char *smiley) {
    MicroBitImage img(smiley);
    uBit.display.print(img);
}

void printPairPattern() {
    ManagedString name = ManagedString(microbit_friendly_name());
    MicroBitImage image(5, 5);
    for (int i = 0; i < MICROBIT_NAME_LENGTH; i++) {
        for (int j = 0; j < MICROBIT_NAME_CODE_LETTERS; j++) {
            if (name.charAt(i) == CODEBOOK[i][j]) {
                for (int k = 0; k < j + 1; k++) {
                    image.setPixelValue(i, 4 - k, 100);
                }
            }
        }
    }
    uBit.display.image.paste(image);
}

void printPairPatternAnimated() {
    const uint8_t levels[] = {10, 40, 100};
    const uint8_t intervals[] = {80, 30, 30};
    ManagedString name = ManagedString(microbit_friendly_name());
    MicroBitImage image(5, 5);
    for (unsigned int pass = 0; pass < sizeof(levels); pass++) {
        uint8_t brightness = levels[pass];
        uint8_t sleepMs = intervals[pass];
        for (int i = 0; i < MICROBIT_NAME_LENGTH; i++) {
            for (int j = 0; j < MICROBIT_NAME_CODE_LETTERS; j++) {
                if (name.charAt(i) == CODEBOOK[i][j]) {
                    for (int k = 0; k < j + 1; k++) {
                        image.setPixelValue(i, 4 - k, brightness);
                        uBit.sleep(sleepMs);
                        uBit.display.image.paste(image);
                    }
                }
            }
        }
    }
    uBit.sleep(200);
    // Blink twice
    for (int b = 0; b < 2; b++) {
        MicroBitImage img = uBit.display.image.clone();
        uBit.display.clear();
        uBit.sleep(150);
        uBit.display.image.paste(img);
        uBit.sleep(100);
    }
}

void onConnected(MicroBitEvent) {
    connected = 1;
    printSmiley(GLAD_SMILEY);
}

void onDisconnected(MicroBitEvent) {
    connected = 0;
    printSmiley(SAD_SMILEY);
    uBit.sleep(2000);
    printPairPattern();
}

int main() {
    uBit.init();

    uBit.messageBus.listen(MICROBIT_ID_BLE, MICROBIT_BLE_EVT_CONNECTED, onConnected);
    uBit.messageBus.listen(MICROBIT_ID_BLE, MICROBIT_BLE_EVT_DISCONNECTED, onDisconnected);

    uBit.bleManager.setTransmitPower(7);

    btn = new MicroBitButtonService(*uBit.ble);
    accel = new MicroBitAccelerometerService(*uBit.ble, uBit.accelerometer);

    printSmiley(GLAD_SMILEY);
    uBit.sleep(400);
    if (!connected) {
        printPairPatternAnimated();
    }
    if (connected) {
        printSmiley(GLAD_SMILEY);
    }
    release_fiber();
}
