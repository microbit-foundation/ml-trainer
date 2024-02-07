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
  processResponseMessage,
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

  it('sets the remainingInput from incomplete message', () => {
    const message1 = 'R[0]INCOMPLETE';

    const msgs = splitMessages(message1);

    expect(msgs.messages.length).toEqual(0);
    expect(msgs.remainingInput).toEqual(message1);
  });

  it('processes empty input correctly', () => {
    const msgs = splitMessages('');

    expect(msgs.messages.length).toEqual(0);
    expect(msgs.remainingInput).toEqual('');
  });

  it('throws away empty lines correctly', () => {
    const msgs = splitMessages('\n\n\n');

    expect(msgs.messages.length).toEqual(0);
    expect(msgs.remainingInput).toEqual('');
  });

  it('throws away remainingInput of invalid type', () => {
    const message1 = 'R[0]START[]';
    const message_invalid_start = 'NOT_A_VALID_MSG_START';

    const msgs = splitMessages(message1 + '\n' + message_invalid_start);

    expect(msgs.messages.length).toEqual(1);
    expect(msgs.messages[0]).toEqual(message1);
    expect(msgs.remainingInput).toEqual('');
  });

  it('throws messages of invalid type', () => {
    const msgs = splitMessages('P00\nC11\nR22\nX33\n');

    expect(msgs.messages.length).toEqual(3);
    expect(msgs.messages[0]).toEqual('P00');
    expect(msgs.messages[1]).toEqual('C11');
    expect(msgs.messages[2]).toEqual('R22');
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

describe('processResponseMessage', () => {
  it('processes valid Handshake responses', () => {
    const message1 = 'R[0]HS[1]';
    const message2 = 'R[1122aabb]HS[255]';

    const got1 = processResponseMessage(message1);
    const got2 = processResponseMessage(message2);

    expect(got1).toEqual({
      message: message1,
      messageId: 0,
      cmdType: 'HS',
      value: 1,
    });
    expect(got2).toEqual({
      message: message2,
      messageId: 0x1122aabb,
      cmdType: 'HS',
      value: 255,
    });
  });

  it('processes valid Radio Frequency response', () => {
    const message = 'R[1234]RF[42]';

    const got = processResponseMessage(message);

    expect(got).toEqual({
      message: message,
      messageId: 0x1234,
      cmdType: 'RF',
      value: 42,
    });
  });

  it('processes valid Remote micro:bit ID response', () => {
    const message = 'R[1234]RMBID[4294967295]';

    const got = processResponseMessage(message);

    expect(got).toEqual({
      message: message,
      messageId: 0x1234,
      cmdType: 'RMBID',
      value: 4294967295,
    });
  });

  it('processes valid Software Versions responses', () => {
    const message1 = 'R[1234]SWVER[0.0.0]';
    const message2 = 'R[1234]SWVER[99.99.99]';
    const message3 = 'R[1234]SWVER[1.2.3]';

    const got1 = processResponseMessage(message1);
    const got2 = processResponseMessage(message2);
    const got3 = processResponseMessage(message3);

    expect(got1).toEqual({
      message: message1,
      messageId: 0x1234,
      cmdType: 'SWVER',
      value: '0.0.0',
    });
    expect(got2).toEqual({
      message: message2,
      messageId: 0x1234,
      cmdType: 'SWVER',
      value: '99.99.99',
    });
    expect(got3).toEqual({
      message: message3,
      messageId: 0x1234,
      cmdType: 'SWVER',
      value: '1.2.3',
    });
  });

  it('processes valid Hardware Versions responses', () => {
    const message1 = 'R[1234]HWVER[0]';
    const message2 = 'R[1234]HWVER[9999]';

    const got1 = processResponseMessage(message1);
    const got2 = processResponseMessage(message2);

    expect(got1).toEqual({
      message: message1,
      messageId: 0x1234,
      cmdType: 'HWVER',
      value: 0,
    });
    expect(got2).toEqual({
      message: message2,
      messageId: 0x1234,
      cmdType: 'HWVER',
      value: 9999,
    });
  });

  it('processes valid Zstart response', () => {
    const message = 'R[1234]ZSTART[]';

    const got = processResponseMessage(message);

    expect(got).toEqual({
      message: message,
      messageId: 0x1234,
      cmdType: 'ZSTART',
      value: '',
    });
  });

  it('processes valid Stop response', () => {
    const message = 'R[1234]STOP[]';

    const got = processResponseMessage(message);

    expect(got).toEqual({
      message: message,
      messageId: 0x1234,
      cmdType: 'STOP',
      value: '',
    });
  });

  it('throws away messages that are not a response', () => {
    // First a valid response to stablish a baseline
    expect(processResponseMessage('R[0]STOP[]')).not.toBeUndefined();
    // Now non-response messages types
    expect(processResponseMessage('C[0]STOP[]')).toBeUndefined();
    expect(processResponseMessage('P[0]STOP[]')).toBeUndefined();
    expect(processResponseMessage('P0E80495C4341')).toBeUndefined();
    // Invalid message types
    expect(processResponseMessage('Z[0]STOP[]')).toBeUndefined();
    expect(processResponseMessage('9[0]STOP[]')).toBeUndefined();
  });

  it('throws away response messages with invalid IDs', () => {
    // First a valid response to stablish a baseline
    expect(processResponseMessage('R[0]STOP[]')).not.toBeUndefined();
    // Now invalid IDs
    expect(processResponseMessage('R[]STOP[]')).toBeUndefined();
    expect(processResponseMessage('R[123456789]STOP[]')).toBeUndefined();
    expect(processResponseMessage('R[12G]STOP[]')).toBeUndefined();
    expect(processResponseMessage('R[-1]STOP[]')).toBeUndefined();
    expect(processResponseMessage('R[1.1]STOP[]')).toBeUndefined();
    expect(processResponseMessage('R[word]STOP[]')).toBeUndefined();
  });

  it('throws away response messages with invalid number values', () => {
    // First valid messages to stablish a baseline
    expect(processResponseMessage('R[0]RF[10000]')).not.toBeUndefined();
    // Now invalid values
    expect(processResponseMessage('R[0]RF[-1]')).toBeUndefined();
    expect(processResponseMessage('R[0]RF[1-2]')).toBeUndefined();
    expect(processResponseMessage('R[0]RF[1,2]')).toBeUndefined();
    expect(processResponseMessage('R[0]RF[1F]')).toBeUndefined();
    expect(processResponseMessage('R[0]RF[word]')).toBeUndefined();
  });

  it('throws away response messages with invalid version values', () => {
    // First valid messages to stablish a baseline
    expect(processResponseMessage('R[0]SWVER[1.1.1]')).not.toBeUndefined();
    // Now invalid values
    expect(processResponseMessage('R[0]SWVER[1]')).toBeUndefined();
    expect(processResponseMessage('R[0]SWVER[1.1]')).toBeUndefined();
    expect(processResponseMessage('R[0]SWVER[123.1.1]')).toBeUndefined();
    expect(processResponseMessage('R[0]SWVER[1.123.1]')).toBeUndefined();
    expect(processResponseMessage('R[0]SWVER[1.1.123]')).toBeUndefined();
    expect(processResponseMessage('R[0]SWVER[11.22.AA]')).toBeUndefined();
    expect(processResponseMessage('R[0]SWVER[word]')).toBeUndefined();
  });

  it('throws away response messages with invalid empty value', () => {
    // First a valid response to stablish a baseline
    expect(processResponseMessage('R[0]STOP[]')).not.toBeUndefined();
    // Now non-response messages types
    expect(processResponseMessage('R[0]STOP[0]')).toBeUndefined();
    expect(processResponseMessage('R[0]STOP[-1]')).toBeUndefined();
    expect(processResponseMessage('R[0]STOP[a]')).toBeUndefined();
  });

  it('throws away other types of invalid responses', () => {
    expect(processResponseMessage('R0STOP[]')).toBeUndefined();
    expect(processResponseMessage('[0]STOP[]')).toBeUndefined();
    expect(processResponseMessage('R[0]STOP')).toBeUndefined();
    expect(processResponseMessage('R[0][]')).toBeUndefined();
    expect(processResponseMessage('R[0]')).toBeUndefined();
    expect(processResponseMessage('R[0]STOP[]STOP[]')).toBeUndefined();
    expect(processResponseMessage('R[0]R[1]STOP[]')).toBeUndefined();
    expect(processResponseMessage('R[0]STOP[]S')).toBeUndefined();
    expect(processResponseMessage('R[0]RF[1')).toBeUndefined();
    expect(processResponseMessage('R[0]RF1]')).toBeUndefined();
  });
});
