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

typedef __uint8_t uint8_t;

// Services
MicroBitAccelerometerService *accel;
MicroBitUARTService *uart;
MicroBitLEDService *led;
MicroBitIOPinService *io;
MicroBitButtonService *btn;

// State
int connected = 0;
bool isCollectFieldDataMode = false;

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
 * @brief Log action data in first row
 */
void logActionDataIfEmptyLog(const ManagedString actionData)
{
    uint32_t csvLen = uBit.log.getDataLength(DataFormat::CSV);
    if (!csvLen)
    {
        uBit.log.beginRow();
        uBit.log.logString(actionData);
        uBit.log.endRow();
    }
}

/**
 * @brief Handler for incoming UART messages.
 */
void onDelim(MicroBitEvent)
{
    int beat = 200;
    ManagedString r = uart->readUntil("#");
    ManagedString prefix = r.substring(0, 2);
    if (prefix == "s_")
    { // Will be request to play sound
        ManagedString soundNo = r.substring(2, 1);
        playSound(getSound(soundNo), beat);
    }
    if (prefix == "f_")
    { // Collect field data
        // TODO: Get action data from uart message
        logActionDataIfEmptyLog(ManagedString("still,0000000000111110000000000;shake,0000010101010100000000000;\n"));
        ManagedString data = r.substring(2, 1);
        uBit.display.scroll(data);
        // collectFieldData();
    }
}

int main()
{
    if (isCollectFieldDataMode)
    {
        collectFieldData();
    }

    // Initialise the micro:bit runtime.
    uBit.init();

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
    if (!connected)
    {
        printPairPatternAnimated();
    }
    if (connected)
    {
        printSmiley(GLAD_SMILEY);
    }
    release_fiber();
}
