/**
 * (c) 2023, Center for Computational Thinking and Design at Aarhus University and contributors
 *
 * SPDX-License-Identifier: MIT
 */
#include "MicroBit.h"

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

const char *const STILL = "\
    000,000,000,000,000\n\
    000,000,000,000,000\n\
    070,070,070,070,070\n\
    000,000,000,000,000\n\
    000,000,000,000,000\n";

const char *const SHAKE = "\
    000,000,000,000,000\n\
    000,070,000,070,000\n\
    070,000,070,000,070\n\
    000,000,000,000,000\n\
    000,000,000,000,000\n";

// actionId 0 means still
// actionId 1 means shake
int actionId = 0;

// Number of samples per recording
int sampleSize = 80;

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

ManagedString refreshAction()
{
    if (actionId % 2 == 0)
    {
        printLed(STILL);
        return ManagedString("still");
    }
    else
    {
        printLed(SHAKE);
        return ManagedString("shake");
    }
}

void collectFieldData()
{
    bool isLogging = false;
    int numSamples = 0;
    ManagedString currAction = refreshAction();
    while (1)
    {
        if (uBit.log.isFull())
        {
            uBit.display.scroll("F");
            isLogging = false;
        }
        if (uBit.buttonA.wasPressed() && !isLogging)
        {
            actionId++;
            currAction = refreshAction();
        }
        if (uBit.buttonB.wasPressed() && !isLogging)
        {
            actionId--;
            currAction = refreshAction();
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
            refreshAction();
        }
    }
}