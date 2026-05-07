# Data collection hex files

## Bluetooth

The Bluetooth hex files are derived from https://makecode.microbit.org/_MdUU3fEqvRxw

### Generating hex files with different Bluetooth modes

The different Bluetooth pairing modes can be configured in the MakeCode project. To ensure the correct mode has been configured, trigger a hex compilation and test using the nrf Connect app.

To force compilation:

1. Add the **datalogger** extension to your project
2. Download the hex file
3. Remove the datalogger extension
4. Download the hex file again

Use the **nRF Connect** mobile app to verify the Bluetooth mode:

1. Install nRF Connect ([Android](https://play.google.com/store/apps/details?id=no.nordicsemi.android.mcp) / [iOS](https://apps.apple.com/app/nrf-connect/id1054362403))
2. Flash the hex file to your micro:bit
3. Open nRF Connect and scan for devices
4. Attempt to connect to your micro:bit in Bluetooth mode
5. Start notifications for the partial flashing service (the multiple arrows pointing down icon)
6. Verify the pairing behaviour matches your selected mode

### Separating a universal hex

There's a universal hex with each Bluetooth mode. They are then split into individual hex files.

https://microbit-foundation.github.io/microbit-universal-hex/examples/separate.html

## Radio bridge

See https://github.com/microbit-foundation/sensor-radio-bridge
