/**
 * (c) 2024, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */

export type SplittedMessages = {
  messages: string[];
  remainingInput: string;
};

export enum MessageTypes {
  Command = 'C',
  Response = 'R',
  Periodic = 'P',
}

export enum CommandTypes {
  Handshake = 'HS',
  Start = 'START',
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

const periodicMessageRegexString =
  'P\\[[\\w]*?\\]AX\\[[\\d-]*?\\]AY\\[[\\d-]*?\\]AZ\\[[\\d-]*?\\]BA\\[[01]\\]BB\\[[01]\\]';

const messageRegex = new RegExp(periodicMessageRegexString, 'g');
const remainingInputAfterMessageRegex = new RegExp(
  `(?<=${periodicMessageRegexString}).*`,
  'g',
);
// TODO: This should probably be replaced with a single regex and named groups
const accelerometerXRegex = /(?<=AX\[)[\d-]+?(?=\])/;
const accelerometerYRegex = /(?<=AY\[)[\d-]+?(?=\])/;
const accelerometerZRegex = /(?<=AZ\[)[\d-]+?(?=\])/;
const buttonARegex = /(?<=BA\[)[01](?=\])/;
const buttonBRegex = /(?<=BB\[)[01](?=\])/;
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
  const messages = message.match(messageRegex);

  if (!messages) {
    return undefined;
  }

  // TODO: A regex per value is probably unefficient
  // Also, we should check all values are valid first, throw away entire message if there is a single invalid value
  return {
    accelerometerX: Number(message.match(accelerometerXRegex)?.[0]) || 0,
    accelerometerY: Number(message.match(accelerometerYRegex)?.[0]) || 0,
    accelerometerZ: Number(message.match(accelerometerZRegex)?.[0]) || 0,
    buttonA: Number(message.match(buttonARegex)?.[0]) || 0,
    buttonB: Number(message.match(buttonBRegex)?.[0]) || 0,
  };
};

export const generateCommand = (
  cmdType: CommandTypes,
  cmdData: string = '',
): ProtocolMessage => {
  // TODO: Hack! Currently hardcoding the periodic for Accelerometer and Buttons
  if (cmdType === CommandTypes.Start) {
    cmdData = 'AB';
  }
  let msg = {
    message: `C[${commandId.toString(16).padStart(8, '0')}]${cmdType}[${cmdData}]\n`,
    messageType: MessageTypes.Command,
    messageId: commandId,
  };
  commandId++;
  return msg;
};
