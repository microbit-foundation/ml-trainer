/**
 * @jest-environment jsdom
 */
/**
 * (c) 2024, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */

import {
  MicrobitSensorState,
  splitMessages,
  processPeriodicMessage,
  processHandshake,
  MessageResponse,
  CommandTypes,
} from '../script/microbit-interfacing/serialProtocol';

describe('splitMessages', () => {
  it('splits a single message', () => {
    const message = 'P0E80495C4341\n';

    const got = splitMessages(message);

    expect(got.messages.length).toEqual(1);
    expect(got.messages[0]).toEqual(message.slice(0, -1));
    expect(got.remainingInput).toEqual('');
  });

  it('splits multiple messages', () => {
    const message1 = 'P21998AEC2F80';
    const message2 = 'P21FFF000FFF3';
    const message3 = 'P45000FFF0002';

    const msgs = splitMessages(message1 + '\n' + message2 + '\n' + message3 + '\n');

    expect(msgs.messages.length).toEqual(3);
    expect(msgs.messages[0]).toEqual(message1);
    expect(msgs.messages[1]).toEqual(message2);
    expect(msgs.messages[2]).toEqual(message3);
    expect(msgs.remainingInput).toEqual('');
  });

  it('splits multiple messages with extra input', () => {
    const message1 = 'P188009584343';
    const message2 = 'P19998AEC2F80';
    const message3 = 'P201234';

    const msgs = splitMessages(message1 + '\n' + message2 + '\n' + message3);

    expect(msgs.messages.length).toEqual(2);
    expect(msgs.messages[0]).toEqual(message1);
    expect(msgs.messages[1]).toEqual(message2);
    expect(msgs.remainingInput).toEqual(message3);
  });

  it('processes empty input correctly', () => {
    const msgs = splitMessages('');

    expect(msgs.messages.length).toEqual(0);
    expect(msgs.remainingInput).toEqual('');
  });
});

describe('processPeriodicMessage', () => {
  it('extracts the micro:bit state from the message', () => {
    const message = 'P0E80495C4341';

    const got = processPeriodicMessage(message);

    const want: MicrobitSensorState = {
      accelerometerX: 4,
      accelerometerY: 348,
      accelerometerZ: -972,
      buttonA: 1,
      buttonB: 0,
    };
    expect(got).toEqual(want);
  });

  it('processes min/max values correctly', () => {
    const message1 = 'P00FFF000FFF0';
    const want1: MicrobitSensorState = {
      accelerometerX: 2047,
      accelerometerY: -2048,
      accelerometerZ: 2047,
      buttonA: 0,
      buttonB: 0,
    };
    const message2 = 'PFF000FFF0003';
    const want2: MicrobitSensorState = {
      accelerometerX: -2048,
      accelerometerY: 2047,
      accelerometerZ: -2048,
      buttonA: 1,
      buttonB: 1,
    };

    const got1 = processPeriodicMessage(message1);
    const got2 = processPeriodicMessage(message2);

    expect(got1).toEqual(want1);
    expect(got2).toEqual(want2);
  });

  it('ignores messages that are not periodic', () => {
    const message1 = 'C001112223334';
    const message2 = 'R001112223334';

    const got1 = processPeriodicMessage(message1);
    const got2 = processPeriodicMessage(message2);

    expect(got1).toBeUndefined();
    expect(got2).toBeUndefined();
  });

  it('ignores wrong length input', () => {
    const message1 = 'P21998AEC2F8\n';
    const message2 = 'P21998AEC2F';

    const got1 = processPeriodicMessage(message1);
    const got2 = processPeriodicMessage(message2);

    expect(got1).toBeUndefined();
    expect(got2).toBeUndefined();
  });

  it('detects invalid button values', () => {
    const message1 = 'P000000000004';
    const message2 = 'P00000000000F';

    const got1 = processPeriodicMessage(message1);
    const got2 = processPeriodicMessage(message2);

    expect(got1).toBeUndefined();
    expect(got2).toBeUndefined();
  });

  it('detects invalid hex values', () => {
    const message1 = 'Pz01112223334';

    const got1 = processPeriodicMessage(message1);

    expect(got1).toBeUndefined();
  });
});

describe('processHandshake', () => {
  it('parses valid', () => {
    const message = 'R[ffffffff]HS[1]';

    const got = processHandshake(message);

    const want: MessageResponse = {
      cmdType: CommandTypes.Handshake,
      messageId: 2 ** 32 - 1,
      value: 1,
    };
    expect(got).toEqual(want);
  });

  it('returns undefined for broken', () => {
    expect(processHandshake('R[0]R[0]HS[1]')).toBeUndefined();
    expect(processHandshake('R[0]HS[1]HS[1]')).toBeUndefined();
    expect(processHandshake('R[0HS[1]')).toBeUndefined();
    expect(processHandshake('R[0]HS[1')).toBeUndefined();
    expect(processHandshake('R[0]HS[]')).toBeUndefined();
    expect(processHandshake('R[]HS[]')).toBeUndefined();
  });
});
