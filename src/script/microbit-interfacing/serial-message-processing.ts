/**
 * (c) 2023, Center for Computational Thinking and Design at Aarhus University and contributors
 *
 * SPDX-License-Identifier: MIT
 */

type MicrobitState = {
  X: number;
  Y: number;
  Z: number;
  ButtonA: boolean;
  ButtonB: boolean;
  ButtonLogo: boolean;
};

const messageRegex =
  /P\[[\w]*?\]AX\[[\d-]*?\]AY\[[\d-]*?\]AZ\[[\d-]*?\]BA\[[01]\]BB\[[01]\]BL\[[01]\]/g;

const valueRegex = /(?<=\[)[\d-]+?(?=\])/;

const accelerometerXRegex = /AX\[[\d-]*?\]/;
const accelerometerYRegex = /AY\[[\d-]*?\]/;
const accelerometerZRegex = /AZ\[[\d-]*?\]/;
const buttonARegex = /BA\[[01]*?\]/;
const buttonBRegex = /BB\[[01]*?\]/;
const buttonLogoRegex = /BL\[[01]*?\]/;

const extractValueFromMessage = (message: string): number => {
  return Number(message.match(valueRegex)?.[0]) || 0;
}

export const processMessage = (message: string): { states: MicrobitState[], remainingInput: string } => {
  const messages = message.match(messageRegex);
  const states = messages?.map(message => ({
    X: extractValueFromMessage(message.match(accelerometerXRegex)?.[0] || ''),
    Y: extractValueFromMessage(message.match(accelerometerYRegex)?.[0] || ''),
    Z: extractValueFromMessage(message.match(accelerometerZRegex)?.[0] || ''),
    ButtonA: !!extractValueFromMessage(message.match(buttonARegex)?.[0] || ''),
    ButtonB: !!extractValueFromMessage(message.match(buttonBRegex)?.[0] || ''),
    ButtonLogo: !!extractValueFromMessage(message.match(buttonLogoRegex)?.[0] || ''),
  })) || [];

  return {
    states,
    remainingInput: message.replaceAll(messageRegex, ''),
  };
};
