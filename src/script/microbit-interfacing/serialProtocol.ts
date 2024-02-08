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

export enum CommandTypes {
  Handshake = 'HS',
  RadioFrequency = 'RF',
  RemoteMbId = 'RMBID',
  SoftwareVersion = 'SWVER',
  HardwareVersion = 'HWVER',
  Zstart = 'ZSTART',
  Stop = 'STOP',
}

enum ResponseExtraTypes {
  Error = 'ERROR',
}

export type ResponseTypes = CommandTypes | ResponseExtraTypes;
export const ResponseTypes = { ...CommandTypes, ...ResponseExtraTypes };

export type MessageCmd = {
  message: string;
  messageId: number;
  type: CommandTypes;
  value: number | string;
};

export type MessageResponse = {
  message: string;
  messageId: number;
  type: ResponseTypes;
  value: number | string;
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

export const splitMessages = (message: string): SplittedMessages => {
  if (!message) {
    return {
      messages: [],
      remainingInput: '',
    };
  }
  let messages = message.split('\n');
  let remainingInput = messages.pop() || '';

  // Throw away any empty messages and messages that don't start with a valid type
  messages = messages.filter(
    (msg: string) =>
      msg.length > 0 && Object.values(MessageTypes).includes(msg[0] as MessageTypes),
  );

  // Any remaining input will be the start of the next message, so if it doesn't start
  // with a valid type throw it away as it'll be prepended to the next serial string
  if (
    remainingInput.length > 0 &&
    !Object.values(MessageTypes).includes(remainingInput[0] as MessageTypes)
  ) {
    remainingInput = '';
  }

  return {
    messages,
    remainingInput,
  };
};

export const processResponseMessage = (message: string): MessageResponse | undefined => {
  // Regex for a message response with 3 groups:
  // id    -> The message ID, 1-8 hex characters
  // cmd   -> The command type, a string, only capital letters, matching CommandTypes
  // value -> The response value, empty string or a word, number,
  //          or version (e.g 1.2.3) depending on the command type
  const responseMatch =
    /^R\[(?<id>[0-9A-Fa-f]{1,8})\](?<cmd>[A-Z]+)\[(?<value>-?[\w.]*)\]$/.exec(message);
  if (!responseMatch || !responseMatch.groups) {
    return undefined;
  }
  const messageId = parseInt(responseMatch.groups['id'], 16);
  if (isNaN(messageId)) {
    return undefined;
  }
  const responseType = responseMatch.groups['cmd'] as ResponseTypes;
  if (!Object.values(ResponseTypes).includes(responseType)) {
    return undefined;
  }
  let value: string | number = responseMatch.groups['value'];
  switch (responseType) {
    // Commands with numeric values
    case ResponseTypes.Handshake:
    case ResponseTypes.RadioFrequency:
    case ResponseTypes.RemoteMbId:
    case ResponseTypes.HardwareVersion:
    case ResponseTypes.Error:
      value = Number(value);
      if (isNaN(value) || value < 0 || value > 0xffffffff) {
        return undefined;
      }
      break;
    // Commands without values
    case ResponseTypes.Zstart:
    case ResponseTypes.Stop:
      if (value !== '') {
        return undefined;
      }
      break;
    // Semver-ish values (valid range 00.00.00 to 99.99.99)
    case ResponseTypes.SoftwareVersion:
      if (!/^[0-9]{1,2}\.[0-9]{1,2}\.[0-9]{1,2}$/.test(value)) {
        return undefined;
      }
      break;
  }
  return {
    message,
    messageId,
    type: responseType,
    value,
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

const generateCommand = (cmdType: CommandTypes, cmdData: string = ''): MessageCmd => {
  // Generate an random (enough) ID with max value of 8 hex digits
  const msgID = Math.floor(Math.random() * 0xffffffff);
  return {
    message: `C[${msgID.toString(16).toUpperCase()}]${cmdType}[${cmdData}]\n`,
    messageId: msgID,
    type: cmdType,
    value: cmdData,
  };
};

export const generateCmdHandshake = (): MessageCmd => {
  return generateCommand(CommandTypes.Handshake);
};

export const generateCmdStart = (sensors: MicrobitSensors): MessageCmd => {
  let cmdData = '';
  if (sensors.accelerometer) {
    cmdData += 'A';
  }
  if (sensors.buttons) {
    cmdData += 'B';
  }
  return generateCommand(CommandTypes.Zstart, cmdData);
};

export const generateCmdStop = (): MessageCmd => {
  return generateCommand(CommandTypes.Stop);
};

export const generateCmdRadioFrequency = (frequency: number): MessageCmd => {
  if (frequency < 0 || frequency > 83) {
    throw new Error('Radio frequency out of range');
  }
  return generateCommand(CommandTypes.RadioFrequency, frequency.toString());
};

export const generateCmdRemoteMbId = (remoteMicrobitId: number): MessageCmd => {
  if (remoteMicrobitId < 0 || remoteMicrobitId > 0xffffffff) {
    throw new Error('Remote micro:bit ID out of range');
  }
  return generateCommand(CommandTypes.RemoteMbId, remoteMicrobitId.toString());
};

export const generateRandomRadioFrequency = (): number => {
  // The value range for radio frequencies is 0 to 83
  return Math.floor(Math.random() * 84);
};
