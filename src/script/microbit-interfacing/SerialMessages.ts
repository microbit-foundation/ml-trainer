/**
 * (c) 2023, Center for Computational Thinking and Design at Aarhus University and contributors
 *
 * SPDX-License-Identifier: MIT
 */

// This regex extracts number content in square brackets
const bracketContentRegex = /(?<=\[)-?\d+?(?=\])/;
// This regex matches on messages in the format 'AX[408],AY[748],AZ[-1288],BA[0],BB[1],BL[0]'
const messageRegex =
  /AX\[(.*?)\]AY\[(.*?)\]AZ\[(.*?)\]BA\[(.*?)\]BB\[(.*?)\]BL\[(.*?)\]/;

const newMessageRegex =
 /.*\[(.*?)\]/;

type MicrobitState = {
  X: number;
  Y: number;
  Z: number;
  ButtonA: boolean;
  ButtonB: boolean;
  ButtonLogo: boolean;
};

let currentLine = '';

const extractValueFromMessagePart = (messagePart: string): number => {
  return Number(messagePart.match(bracketContentRegex)?.[0]) || 0;
};

/**
 * Parse a message and return a MicrobitState object from it
 *
 * @param message in the format 'AX[408],AY[748],AZ[-1288],BA[0],BB[1],BL[0]'
 */
export const parseMessage = (message: string): MicrobitState => {

  return {
    X: extractValueFromMessagePart(message.match(/AX\[(.*?)\]/)?.[0] || ''),
    Y: extractValueFromMessagePart(message.match(/AY\[(.*?)\]/)?.[0] || ''),
    Z: extractValueFromMessagePart(message.match(/AZ\[(.*?)\]/)?.[0] || ''),
    ButtonA: !!extractValueFromMessagePart(message.match(/BA\[(.*?)\]/)?.[0] || ''),
    ButtonB: !!extractValueFromMessagePart(message.match(/BB\[(.*?)\]/)?.[0] || ''),
    ButtonLogo: !!extractValueFromMessagePart(message.match(/BL\[(.*?)\]/)?.[0] || ''),
  };
};

const processMessage = (message: string) => {
  const line = currentLine + message;
  const messageMatch = line.match(messageRegex);
  if (messageMatch) {
    const microbitState = parseMessage(messageMatch[0]);
    currentLine = messageMatch.slice(1, messageMatch.length - 1).join('');
    console.log(JSON.stringify(microbitState));
  } else {
    currentLine = currentLine + message;
  }
};