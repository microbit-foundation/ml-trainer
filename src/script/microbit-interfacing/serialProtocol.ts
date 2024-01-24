/**
 * (c) 2024, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */

export type SplittedMessages = {
  messages: string[];
  remainingInput: string;
};

enum MessageTypes {
  Command = 'C',
  Response = 'R',
  Periodic = 'P',
}

enum CommandTypes {
  Handshake = 'HS',
  Zstart = 'ZSTART',
  Stop = 'STOP',
}

export type ProtocolMessage = {
  message: string;
  messageType: MessageTypes;
  messageId: number;
};

export type MessageResponse = {
  cmdType: CommandTypes;
  messageId: number;
  value: number;
};

// More sensors are available in the protocol, but we only support these two
export type MicrobitSensors = {
  accelerometer: boolean;
  buttons: boolean;
};

export type MicrobitSensorState = {
  accelerometerX: number;
  accelerometerY: number;
  accelerometerZ: number;
  buttonA: number;
  buttonB: number;
};

// Currently implemented protocol version
export const version = 1;

// TODO: Revisit this regexes, they are probably not optimal
const responseIdRegex = 'R\\[([\\w]*?)\\]';
const handshakeRegex = /(?<=HS\[)[\d]+?(?=\])/;

let commandId = 1;

export const splitMessages = (message: string): SplittedMessages => {
  if (!message) {
    return {
      messages: [],
      remainingInput: '',
    };
  }
  const messages = message.split('\n');
  let remainingInput = messages.pop() || '';
  return {
    messages,
    remainingInput,
  };
};

export const processHandshake = (message: string): MessageResponse | undefined => {
  const responseIdMatch = message.match(responseIdRegex);
  if (!responseIdMatch) {
    return undefined;
  }
  let protocolVersion = Number(message.match(handshakeRegex)?.[0]);
  if (!protocolVersion) {
    return undefined;
  }
  return {
    messageId: Number(responseIdMatch[1]),
    cmdType: CommandTypes.Handshake,
    value: protocolVersion,
  };
};

export const processPeriodicMessage = (
  message: string,
): MicrobitSensorState | undefined => {
  // Basic checks to match the message being a compact periodic message
  if (message.length !== 13 || message[0] !== MessageTypes.Periodic) {
    return undefined;
  }
  // All characters except the first one should be hex
  if (!/^[0-9A-Fa-f]+$/.test(message.substring(1))) {
    return undefined;
  }

  // Only the two Least Significant Bits from the buttons are used
  const buttons = parseInt(message[12], 16);
  if (buttons > 3) {
    return undefined;
  }

  return {
    // The accelerometer data has been clamped to -2048 to 2047, and an offset
    // added to make the values positive, so that needs to be reversed
    accelerometerX: parseInt(message.substring(3, 6), 16) - 2048,
    accelerometerY: parseInt(message.substring(6, 9), 16) - 2048,
    accelerometerZ: parseInt(message.substring(9, 12), 16) - 2048,
    // Button A is the LSB, button B is the next bit
    buttonA: buttons & 1,
    buttonB: (buttons >> 1) & 1,
  };
};

const generateCommand = (
  cmdType: CommandTypes,
  cmdData: string = '',
): ProtocolMessage => {
  let msg = {
    message: `C[${commandId.toString(16).padStart(8, '0')}]${cmdType}[${cmdData}]\n`,
    messageType: MessageTypes.Command,
    messageId: commandId,
  };
  commandId++;
  return msg;
};

export const generateCmdHandshake = (): string => {
  return generateCommand(CommandTypes.Handshake).message;
};

export const generateCmdStart = (sensors: MicrobitSensors): string => {
  let cmdData = '';
  if (sensors.accelerometer) {
    cmdData += 'A';
  }
  if (sensors.buttons) {
    cmdData += 'B';
  }
  return generateCommand(CommandTypes.Zstart, cmdData).message;
};
