/**
 * (c) 2023, Center for Computational Thinking and Design at Aarhus University and contributors
 *
 * SPDX-License-Identifier: MIT
 */

import MicrobitUSB from './MicrobitUSB';

const baudRate = 115200;

const writeLine = (message: string) => {
  console.log(message);
};

class MicrobitSerial {
  public static async connect(usb: MicrobitUSB): Promise<void> {
    await MicrobitSerial.streamData(usb.serialPort, { baudRate });
  }

  private static async streamData(
    serialPort: SerialPort,
    options: SerialOptions,
  ): Promise<void> {
    try {
      const decoder = new TextDecoder();

      await serialPort.open(options);
      writeLine(`Opened with baudRate: ${options.baudRate}`);

      if (serialPort.readable) {
        const reader = serialPort.readable.getReader();

        writeLine(`Listening for 5 seconds...`);
        setTimeout(() => reader.cancel(), 5000);
        // const interval = setInterval(() => console.log('THE STATE ->', microbitState), 100);

        let reading = true;
        while (reading) {
          const { value, done } = await reader.read();
          if (value) {
            // processMessage(decoder.decode(value));
            console.log(decoder.decode(value));
          }
          if (done) {
            writeLine('Done');
            reading = false;
          }
          // console.log(microbitState);
        }
        // clearInterval(interval);
        reader.releaseLock();
      }
    } catch (error) {
      console.log('There was an error');
      console.log(error);
    } finally {
      await serialPort.close();
    }
  }
}

export default MicrobitSerial;
