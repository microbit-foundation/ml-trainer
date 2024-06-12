/**
 * (c) 2023, Center for Computational Thinking and Design at Aarhus University and contributors
 *
 * SPDX-License-Identifier: MIT
 */
#include "MicroBit.h"
#include "MicroBitUARTService.h"
#include "MicroBitAccelerometerService.h"
#include "MicroBitIOPinService.h"
#include "MicroBitLEDService.h"
#include "MicroBitButtonService.h"
#include "utilities.h"
#include "smileys.h"

MicroBit uBit;

typedef __uint8_t uint8_t ;

// Services
MicroBitAccelerometerService *accel;
MicroBitUARTService *uart;
MicroBitLEDService *led;
MicroBitIOPinService *io;
MicroBitButtonService *btn;

// State
int connected = 0;

// Manually increase this build number each build. Used by the application to determine what capabilities the firmware has.
int buildNumber = 1;

/**
 * @brief Sends a message with UART
 * 
 * @param s The message
 */
void sendString(ManagedString s)
{
    if (connected == 0)
        return;

    uart->send(s);
}

/**
 * @brief The event that is fired upon bluetooth connection.
 */
void onConnected(MicroBitEvent)
{
    connected = 1; // Set the connected flag

    uBit.sleep(3000);
    uart->send(ManagedString("id_prop")); // MUST be sent before vi_ message
    uart->send(ManagedString("vi_") + ManagedString(buildNumber));

    printSmiley(GLAD_SMILEY);
}

/**
 * @brief The event that is fired upon bluetooth disconnection.
 */
void onDisconnected(MicroBitEvent)
{
    connected = 0; // Set the connected flag
    
    printSmiley(SAD_SMILEY);

    uBit.sleep(2000);
    printPairPattern();
}

/**
 * @brief Handler for incoming UART messages.
 */
void onDelim(MicroBitEvent)
{
    int beat = 200;
    ManagedString r = uart->readUntil("#");
    ManagedString prefix = r.substring(0,2);
    if (prefix == "s_") { // Will be request to play sound
        ManagedString soundNo = r.substring(2,1);
        playSound(getSound(soundNo), beat);
    }
}

int main()
{
    // Initialise the micro:bit runtime.
    uBit.init();

    // Add basic data logging to test utility service.
    uBit.log.setTimeStamp(TimeStampFormat::Seconds);
    bool logging = false;
    bool loop = true;
    while (loop)
    {
        if (uBit.buttonA.wasPressed())
        {
            uBit.display.scroll("L");
            logging = true;
        }
        if (uBit.buttonB.wasPressed())
        {
            uBit.display.scroll("C");
            logging = false;
            uBit.log.clear(false);
            loop = false;
        }
        if (uBit.logo.wasPressed()) {
            logging = false;
            loop = false;
        }
        if (uBit.log.isFull())
        {
            uBit.display.scroll("F");
            logging = false;
            loop = false;
        }
        if (logging)
        {
            uBit.log.beginRow();
            uBit.log.logData("x", uBit.accelerometer.getX());
            uBit.log.logData("y", uBit.accelerometer.getY());
            uBit.log.logData("z", uBit.accelerometer.getZ());
            uBit.log.endRow();
            uBit.sleep(250);
        }
    }

    // Add listeners for events
    uBit.messageBus.listen(MICROBIT_ID_BLE, MICROBIT_BLE_EVT_CONNECTED, onConnected);
    uBit.messageBus.listen(MICROBIT_ID_BLE, MICROBIT_BLE_EVT_DISCONNECTED, onDisconnected);
    uBit.messageBus.listen(MICROBIT_ID_BLE_UART, MICROBIT_UART_S_EVT_DELIM_MATCH, onDelim);

    uBit.bleManager.setTransmitPower(7);

    // Initialise the micro:bit services.
    uart = new MicroBitUARTService(*uBit.ble, 32, 32);
    led = new MicroBitLEDService(*uBit.ble, uBit.display);
    io = new MicroBitIOPinService(*uBit.ble, uBit.io);
    btn = new MicroBitButtonService(*uBit.ble);
    accel = new MicroBitAccelerometerService(*uBit.ble, uBit.accelerometer);

    uart->eventOn("#");

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
