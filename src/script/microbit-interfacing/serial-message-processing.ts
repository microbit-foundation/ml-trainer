/**
 * (c) 2023, Center for Computational Thinking and Design at Aarhus University and contributors
 *
 * SPDX-License-Identifier: MIT
 */

type MicrobitState = {
  accelerometerX: number;
  accelerometerY: number;
  accelerometerZ: number;
};

export type ProcessedInput = {
  state: MicrobitState;
  remainingInput: string;
};

const messageRegex =
  /P\[[\w]*?\]AX\[[\d-]*?\]AY\[[\d-]*?\]AZ\[[\d-]*?\]BA\[[01]\]BB\[[01]\]BL\[[01]\]/g;

const allAfterMessageRegex =
  /(?<=P\[[\w]*?\]AX\[[\d-]*?\]AY\[[\d-]*?\]AZ\[[\d-]*?\]BA\[[01]\]BB\[[01]\]BL\[[01]\]).*/g;

const accelerometerXRegex = /(?<=AX\[)[\d-]+?(?=\])/;
const accelerometerYRegex = /(?<=AY\[)[\d-]+?(?=\])/;
const accelerometerZRegex = /(?<=AZ\[)[\d-]+?(?=\])/;

const extractValueFromMessage = (message: string, regex: RegExp): number => {
  return Number(message.match(regex)?.[0]) || 0;
};

export const processInput = (message: string): ProcessedInput | undefined => {
  const messages = message.match(messageRegex);

  if (!messages) {
    return undefined;
  }

  const state: MicrobitState = {
    accelerometerX: extractValueFromMessage(message, accelerometerXRegex),
    accelerometerY: extractValueFromMessage(message, accelerometerYRegex),
    accelerometerZ: extractValueFromMessage(message, accelerometerZRegex),
  };

  return {
    state,
    remainingInput: (message.match(allAfterMessageRegex) || []).join(''),
  };
};
