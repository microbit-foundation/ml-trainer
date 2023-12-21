/**
 * @jest-environment jsdom
 */
/**
 * (c) 2023, Center for Computational Thinking and Design at Aarhus University and contributors
 *
 * SPDX-License-Identifier: MIT
 */

import { ProcessedInput, processInput } from '../script/microbit-interfacing/serial-message-processing';

describe('processInput', () => {
  it('extracts the micro:bit state from the message', () => {
    const message = 'P[213]AX[408]AY[748]AZ[-1288]BA[1]BB[1]BL[1]';

    const got = processInput(message);

    const want: ProcessedInput = {
      remainingInput: '',
      state: {
        accelerometerX: 408,
        accelerometerY: 748,
        accelerometerZ: -1288,
      },
    };
    expect(got).toEqual(want);
  });

  it('extracts state, and adds other messages to remaining input', () => {
    const message1 = 'P[213]AX[408]AY[748]AZ[-1288]BA[1]BB[1]BL[1]';
    const message2 = 'P[214]AX[-1]AY[133]AZ[84]BA[0]BB[0]BL[1]';
    const message3 = 'P[45]AX[894]AY[-95]AZ[31]BA[1]BB[1]BL[0]';

    const got = processInput(message1 + message2 + message3);

    const want: ProcessedInput = {
      remainingInput: message2 + message3,
      state: {
        accelerometerX: 408,
        accelerometerY: 748,
        accelerometerZ: -1288,
      },
    };
    expect(got).toEqual(want);
  });

  it('extracts state, and adds incomplete messages to remaining input', () => {
    const message1 = 'P[213]AX[408]AY[748]AZ[-1288]BA[1]BB[1]BL[1]';
    const message2 = 'P[214]AX[-1]AY[133]A';

    const got = processInput(message1 + message2);

    const want: ProcessedInput = {
      remainingInput: message2,
      state: {
        accelerometerX: 408,
        accelerometerY: 748,
        accelerometerZ: -1288,
      },
    };
    expect(got).toEqual(want);
  });
});
