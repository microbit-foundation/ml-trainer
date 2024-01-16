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
  Command = "C",
  Response = "R",
  Periodic = "P",
};

export enum CommandTypes {
  Handshake = "HS",
  Start = "START",
  Stop = "STOP",
};

export type protocolMessage = {
  message: string;
  messageType: MessageTypes;
  messageId: number;
};

type MicrobitState = {
  accelerometerX: number;
  accelerometerY: number;
  accelerometerZ: number;
  buttonA: number;
  buttonB: number;
};

export type ProcessedPeriodicMessage = {
  state: MicrobitState;
  remainingInput: string;
};

const handshakeRegexString = 'R\\[[\\w]*?\\]HS\\[\\]';
const responseIdRegex = 'R\\[([\\w]*?)\\]';

const periodicMessageRegexString = 'P\\[[\\w]*?\\]AX\\[[\\d-]*?\\]AY\\[[\\d-]*?\\]AZ\\[[\\d-]*?\\]BA\\[[01]\\]BB\\[[01]\\]';

const messageRegex = new RegExp(periodicMessageRegexString, 'g');
const remainingInputAfterMessageRegex = new RegExp(`(?<=${periodicMessageRegexString}).*`, 'g');
// TODO: This should probably be replaced with a single regex and named groups
const accelerometerXRegex = /(?<=AX\[)[\d-]+?(?=\])/;
const accelerometerYRegex = /(?<=AY\[)[\d-]+?(?=\])/;
const accelerometerZRegex = /(?<=AZ\[)[\d-]+?(?=\])/;
const buttonARegex = /(?<=BA\[)[01](?=\])/;
const buttonBRegex = /(?<=BB\[)[01](?=\])/;

let commandId = 1;

export const splitMessages = (message: string): SplittedMessages => {
  if (!message) {
    return {
      messages: [],
      remainingInput: '',
    }
  }
  const messages = message.split('\n');
  let remainingInput = messages.pop() || '';
  return {
    messages,
    remainingInput,
  }
}

// TODO: Returning undefined to follow processPeriodicMessage example
//      but should it be null or an empty string instead?
export const processHandshake = (message: string): string | undefined => {
  const responseIdMatch = message.match(responseIdRegex);
  if (!responseIdMatch) {
    return undefined;
  }
  return responseIdMatch[1] || undefined;
}

export const processPeriodicMessage = (message: string): ProcessedPeriodicMessage | undefined => {
  const messages = message.match(messageRegex);

  if (!messages) {
    return undefined;
  }

  // TODO: Sanitise the accelerometer and button values

  return {
    state: {
      accelerometerX: Number(message.match(accelerometerXRegex)?.[0]) || 0,
      accelerometerY: Number(message.match(accelerometerYRegex)?.[0]) || 0,
      accelerometerZ: Number(message.match(accelerometerZRegex)?.[0]) || 0,
      buttonA: Number(message.match(buttonARegex)?.[0]) || 0,
      buttonB: Number(message.match(buttonBRegex)?.[0]) || 0,
    },
    remainingInput: (message.match(remainingInputAfterMessageRegex) || []).join(''),
  };
};

export const generateCommand = (cmdType: CommandTypes, cmdData: string = ''): protocolMessage => {
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
}
