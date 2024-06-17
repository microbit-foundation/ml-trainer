/**
 * (c) 2023, Center for Computational Thinking and Design at Aarhus University and contributors
 *
 * SPDX-License-Identifier: MIT
 */
#include "MicroBit.h"
#include "utilities.h"
#include "smileys.h"

extern MicroBit uBit;

const char *const GO = "\
    070,070,070,070,070\n\
    070,000,000,000,070\n\
    070,000,000,000,070\n\
    070,000,000,000,070\n\
    070,070,070,070,070\n";

const char *const RECORDING = "\
    000,000,000,000,000\n\
    000,070,070,070,000\n\
    000,070,070,070,000\n\
    000,070,070,070,000\n\
    000,000,000,000,000\n";

int sampleSize = 80;        // Number of samples per recording
int encodedLedSize = 5 * 5; // LED screen size

class Action
{
public:
    ManagedString name;
    ManagedString led;
};

/**
 * @brief Prints LED pattern
 *
 * @param pattern an array of integers that represents the brightness levels of each LED.
 */
void printLed(const char *pattern)
{
    MicroBitImage outputImage(pattern);
    uBit.display.print(outputImage);
}

void countdown()
{
    int countdownDuration = 500;
    uBit.display.printChar('3', countdownDuration);
    uBit.display.printChar('2', countdownDuration);
    uBit.display.printChar('1', countdownDuration);
    printLed(GO);
    uBit.sleep(countdownDuration);
    uBit.audio.soundExpressions.playAsync("002373041050001000392300001023010802050005000000000000000000000000000000");
    printLed(RECORDING);
}

void printEncodedLed(const ManagedString encodedLed)
{
    char led[] = "000,000,000,000,000\n000,000,000,000,000\n000,000,000,000,000\n000,000,000,000,000\n000,000,000,000,000\n";
    for (int i = 0; i < encodedLedSize; i++)
    {
        // if led is on, change from 000 -> 070
        if (encodedLed.toCharArray()[i] == '1')
        {
            led[i * 4 + 1] = '7';
        }
    }
    printLed(led);
}

ManagedString getAndShowCurrentAction(const Action *actions, int actionId, int numActions)
{
    int id = abs(actionId % numActions);
    Action a = actions[id];
    printEncodedLed(a.led);
    return ManagedString(a.name);
}

int getNumActions()
{
    uint32_t csvLen = uBit.log.getDataLength(DataFormat::CSV);
    int numActions = 0;
    if (csvLen)
    {
        for (size_t i = 0; i < csvLen; i++)
        {
            char csv_char;
            uBit.log.readData(&csv_char, i, 1, DataFormat::CSV, csvLen);
            if (csv_char == ';')
            {
                numActions++;
            }
            if (csv_char == '\n')
            {
                break;
            }
        }
    }
    return numActions;
}

void collectFieldData()
{
    // Parse actions from first row of data log
    uint32_t csvLen = uBit.log.getDataLength(DataFormat::CSV);
    int numActions = getNumActions();
    Action actions[numActions];
    int idx = 0;
    int startSegmentIdx = 0;
    for (size_t i = 0; i < csvLen; i++)
    {
        char csv_char;
        uBit.log.readData(&csv_char, i, 1, DataFormat::CSV, csvLen);
        if (csv_char == ';')
        {
            // Get action name
            int nameSize = i - startSegmentIdx - encodedLedSize - 1;
            char name[nameSize];
            uBit.log.readData(name, startSegmentIdx, nameSize, DataFormat::CSV, csvLen);

            // Get led
            char encodedLed[encodedLedSize];
            uBit.log.readData(encodedLed, i - encodedLedSize, encodedLedSize, DataFormat::CSV, csvLen);

            actions[idx].name = name;
            actions[idx].led = encodedLed;

            idx++;
            startSegmentIdx = i + 1;
        }
        if (csv_char == '\n')
        {
            break;
        }
    }

    bool looping = true;
    bool isLogging = false;
    int numSamples = 0;
    int actionId = 0;

    ManagedString currAction = getAndShowCurrentAction(actions, actionId, numActions);
    while (looping)
    {
        if (uBit.logo.wasPressed())
        {
            looping = false;
            printSmiley(GLAD_SMILEY);
        }
        if (uBit.log.isFull())
        {
            uBit.display.scroll("F");
            isLogging = false;
        }
        if (uBit.buttonA.wasPressed() && !isLogging)
        {
            actionId++;
            currAction = getAndShowCurrentAction(actions, actionId, numActions);
        }
        if (uBit.buttonB.wasPressed() && !isLogging)
        {
            actionId--;
            currAction = getAndShowCurrentAction(actions, actionId, numActions);
        }
        if (uBit.buttonAB.wasPressed() && !isLogging)
        { // Start recording sample
            numSamples = 0;
            countdown();
            uBit.log.beginRow();
            uBit.log.logData("x", "action");
            uBit.log.logData("y", currAction);
            uBit.log.logData("z", "");
            uBit.log.endRow();
            isLogging = true;
        }
        if (isLogging)
        {
            uBit.log.beginRow();
            uBit.log.logData("x", uBit.accelerometer.getX());
            uBit.log.logData("y", uBit.accelerometer.getY());
            uBit.log.logData("z", uBit.accelerometer.getZ());
            uBit.log.endRow();
            uBit.sleep(20);
            numSamples++;
        }
        if (numSamples == sampleSize)
        { // End of recording sample
            numSamples = 0;
            isLogging = false;
            uBit.audio.soundExpressions.playAsync("010230849100001000000100000000012800000100240000000000000000000000000000");
            getAndShowCurrentAction(actions, actionId, numActions);
        }
    }
}