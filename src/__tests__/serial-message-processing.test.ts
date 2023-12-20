/**
 * @jest-environment jsdom
 */
/**
 * (c) 2023, Center for Computational Thinking and Design at Aarhus University and contributors
 *
 * SPDX-License-Identifier: MIT
 */

import { processMessage } from "../script/microbit-interfacing/serial-message-processing";

describe('processMessage', () => {
  it('extracts the micro:bit state from the message', () => {
    const message = 'P[213]AX[408]AY[748]AZ[-1288]BA[1]BB[1]BL[1]';

    const got = processMessage(message);

    expect(got.remainingInput).toEqual('');
    expect(got.states).toEqual([
      {
        X: 408,
        Y: 748,
        Z: -1288,
        ButtonA: true,
        ButtonB: true,
        ButtonLogo: true,
      },
    ]);
  });

  it('extracts multiple micro:bit states from the message', () => {
    const message1 = 'P[213]AX[408]AY[748]AZ[-1288]BA[1]BB[1]BL[1]';
    const message2 = 'P[214]AX[-1]AY[133]AZ[84]BA[0]BB[0]BL[1]';

    const got = processMessage(message1 + message2);

    expect(got.remainingInput).toEqual('');
    expect(got.states).toEqual([
      {
        X: 408,
        Y: 748,
        Z: -1288,
        ButtonA: true,
        ButtonB: true,
        ButtonLogo: true,
      },
      {
        X: -1,
        Y: 133,
        Z: 84,
        ButtonA: false,
        ButtonB: false,
        ButtonLogo: true,
      },
    ]);
  });

  it('returns the remaining incomplete message from the end of the string', () => {
    const message = 'P[214]AX[-1]AY[133]AZ[84]BA[0]BB[0]BL[1]';
    const incompleteMessage = 'P[213]AX[408]AY[748]';

    const got = processMessage(message + incompleteMessage);

    expect(got.remainingInput).toEqual(incompleteMessage);
    expect(got.states).toEqual([
      {
        X: -1,
        Y: 133,
        Z: 84,
        ButtonA: false,
        ButtonB: false,
        ButtonLogo: true,
      },
    ]);
  });

  it('discards incomplete messages from the beginning of the string', () => {
    const incompleteMessage = '288]BA[1]BB[1]BL[1]';
    const message = 'P[214]AX[-1]AY[133]AZ[84]BA[0]BB[0]BL[1]';

    const got = processMessage(incompleteMessage + message);

    expect(got.remainingInput).toEqual('');
    expect(got.states).toEqual([
      {
        X: -1,
        Y: 133,
        Z: 84,
        ButtonA: false,
        ButtonB: false,
        ButtonLogo: true,
      },
    ]);
  });
});
