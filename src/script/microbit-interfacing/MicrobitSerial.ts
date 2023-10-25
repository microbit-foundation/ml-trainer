/**
 * (c) 2023, Center for Computational Thinking and Design at Aarhus University and contributors
 *
 * SPDX-License-Identifier: MIT
 */

const serialNavigator = navigator && navigator.serial;

const baudRate = 115200;

// This regex extracts number content in square brackets
const bracketContentRegex = /(?<=\[)\d+?(?=\])/;
// This regex matches on messages in the format 'AX[408],AY[748],AZ[-1288],BA[0],BB[1],BL[0]'
const messageRegex = /AX\[(.*?)\],AY\[(.*?)\],AZ\[(.*?)\],BA\[(.*?)\],BB\[(.*?)\],BL\[(.*?)\]/;

type MicrobitState = {
    X: number;
    Y: number;
    Z: number;
    ButtonA: boolean;
    ButtonB: boolean;
    ButtonLogo: boolean;
}

let currentLine = '';

const writeLine = (message: string) => {
    console.log(message);
};

const extractValueFromMessagePart = (messagePart: string): number => {
    return Number(messagePart.match(bracketContentRegex)?.[0]) || 0;
}

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
    }
}

const processMessage = (message: string) => {
    const line = currentLine + message;
    const messageMatch = line.match(messageRegex);
    if (messageMatch) {
        const microbitState = parseMessage(messageMatch[0]);
        currentLine = messageMatch.slice(1, messageMatch.length-1).join('');
        writeLine(JSON.stringify(microbitState));
    } else {
        currentLine = currentLine + message;
    }
};

class MicrobitSerial {
    public static async connect(): Promise<void> {
        const serialPort = await serialNavigator.requestPort({ filters: [] });
        await MicrobitSerial.streamData(serialPort, { baudRate });
    }

    private static async streamData(serialPort: SerialPort, options: SerialOptions): Promise<void> {
        try {
            const decoder = new TextDecoder();

            await serialPort.open(options);
            writeLine(`Opened with baudRate: ${options.baudRate}`);

            if (serialPort.readable) {
                const reader = serialPort.readable.getReader();

                writeLine(`Listening for 5 seconds...`);
                setTimeout(() => reader.cancel(), 5000);

                let reading = true;
                while (reading) {
                    const { value, done } = await reader.read();
                    if (value) {
                        processMessage(decoder.decode(value));
                    }
                    if (done) {
                        writeLine('Done');
                        reading = false;
                    }
                }
                reader.releaseLock();
            }
        } catch(error) {
            console.log('There was an error');
            console.log(error);
        } finally {
            await serialPort.close();
        }
    }
}

export default MicrobitSerial
