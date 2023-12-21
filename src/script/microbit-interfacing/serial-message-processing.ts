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

const messageRegexString = 'P\\[[\\w]*?\\]AX\\[[\\d-]*?\\]AY\\[[\\d-]*?\\]AZ\\[[\\d-]*?\\]BA\\[[01]\\]BB\\[[01]\\]BL\\[[01]\\]';

const messageRegex = new RegExp(messageRegexString, 'g');
const remainingInputAfterMessageRegex = new RegExp(`(?<=${messageRegexString}).*`, 'g');
const accelerometerXRegex = /(?<=AX\[)[\d-]+?(?=\])/;
const accelerometerYRegex = /(?<=AY\[)[\d-]+?(?=\])/;
const accelerometerZRegex = /(?<=AZ\[)[\d-]+?(?=\])/;

export const processInput = (message: string): ProcessedInput | undefined => {
  const messages = message.match(messageRegex);

  if (!messages) {
    return undefined;
  }

  return {
    state: {
      accelerometerX: Number(message.match(accelerometerXRegex)?.[0]) || 0,
      accelerometerY: Number(message.match(accelerometerYRegex)?.[0]) || 0,
      accelerometerZ: Number(message.match(accelerometerZRegex)?.[0]) || 0,
    },
    remainingInput: (message.match(remainingInputAfterMessageRegex) || []).join(''),
  };
};
