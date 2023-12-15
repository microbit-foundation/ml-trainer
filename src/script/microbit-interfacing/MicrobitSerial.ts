/**
 * (c) 2023, Center for Computational Thinking and Design at Aarhus University and contributors
 *
 * SPDX-License-Identifier: MIT
 */

import MicrobitUSB from './MicrobitUSB';

const baudRate = 115200;

// This regex extracts number content in square brackets
const bracketContentRegex = /(?<=\[)\d+?(?=\])/;
// This regex matches on messages in the format 'AX[408],AY[748],AZ[-1288],BA[0],BB[1],BL[0]'
const messageRegex =
  /AX\[(.*?)\],AY\[(.*?)\],AZ\[(.*?)\],BA\[(.*?)\],BB\[(.*?)\],BL\[(.*?)\]/;

type MicrobitState = {
  X: number;
  Y: number;
  Z: number;
  ButtonA: boolean;
  ButtonB: boolean;
  ButtonLogo: boolean;
};

let currentLine = '';

const writeLine = (message: string) => {
  console.log(message);
};

const extractValueFromMessagePart = (messagePart: string): number => {
  return Number(messagePart.match(bracketContentRegex)?.[0]) || 0;
};

/**
 * Parse a message and return a MicrobitState object from it
 *
 * @param message in the format 'AX[408],AY[748],AZ[-1288],BA[0],BB[1],BL[0]'
 */
const parseMessage = (message: string): MicrobitState => {
  const parts = message.split(',');

  return {
    X: extractValueFromMessagePart(parts[0]),
    Y: extractValueFromMessagePart(parts[1]),
    Z: extractValueFromMessagePart(parts[2]),
    ButtonA: !!extractValueFromMessagePart(parts[3]),
    ButtonB: !!extractValueFromMessagePart(parts[4]),
    ButtonLogo: !!extractValueFromMessagePart(parts[5]),
  };
};

const processMessage = (message: string) => {
  const line = currentLine + message;
  const messageMatch = line.match(messageRegex);
  if (messageMatch) {
    const microbitState = parseMessage(messageMatch[0]);
    currentLine = messageMatch.slice(1, messageMatch.length - 1).join('');
    writeLine(JSON.stringify(microbitState));
  } else {
    currentLine = currentLine + message;
  }
};

class MicrobitSerial {
  public static async connect(usb: MicrobitUSB): Promise<void> {
    await MicrobitSerial.streamData(usb.serialPort, { baudRate });
  }

  private static async streamData(
    serialPort: SerialPort,
    options: SerialOptions,
  ): Promise<void> {
    const decoder = new TextDecoder();
    const encoder = new TextEncoder();

    try {
      await serialPort.open(options);
      writeLine(`Opened with baudRate: ${options.baudRate}`);

      if (serialPort.readable && serialPort.writable) {
        const reader = serialPort.readable.getReader();
        const writer = serialPort.writable.getWriter();

        const listenTimeSeconds = 10
        writeLine(`Listening for ${listenTimeSeconds} seconds...`);
        setTimeout(() => reader.cancel(), listenTimeSeconds * 1000);

        // setTimeout(() => {
        //   console.log('handshake');
        //   const data = encoder.encode('C[9C515AAF]HS[]\n');
        //   writer.write(data);
        // }, 2000);

        const data = encoder.encode('C[9C515AAF]HS[]\n');
        await writer.write(data);

        let reading = true;
        while (reading) {
          console.log('await read');
          const { value, done } = await reader.read();
          console.log('--- read', value);
          if (value) {
            console.log(decoder.decode(value));
          }
          if (done) {
            writeLine('Done');
            reading = false;
          }
        }
        reader.releaseLock();
        writer.releaseLock();
      }
    } catch (error) {
      console.error('There was an error', error);
    } finally {
      await serialPort.close();
    }
  }
}

export default MicrobitSerial;
