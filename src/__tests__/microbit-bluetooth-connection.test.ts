/**
 * @vitest-environment jsdom
 */
/**
 * (c) 2023, Center for Computational Thinking and Design at Aarhus University and contributors
 *
 * SPDX-License-Identifier: MIT
 */

import MicrobitBluetooth from '../script/microbit-interfacing/MicrobitBluetooth';
import MockBTDevice from './mocks/mock-microbit-bluetooth';
import TypingUtils from '../script/TypingUtils';

describe('Microbit Bluetooth interface tests', () => {
  beforeAll(() => {
    console.warn(
      "Warning: Using requestDevice on any micro:bit that is not named 'vatav', will result in rejection.",
    );
    /** Adds the bluetooth property to the navigator for mocking */
    Object.assign(navigator, {
      bluetooth: {
        requestDevice(
          options?: RequestDeviceOptions & { filters?: any | any[] },
        ): Promise<BluetoothDevice> {
          const microBitName = 'vatav';
          if (!options) {
            return Promise.reject(undefined);
          }
          if (!options.filters) {
            return Promise.reject(undefined);
          }
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          if (options.filters.length == 0) {
            return Promise.reject(undefined);
          }
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          if (!options.filters[0].namePrefix) {
            return Promise.reject(undefined);
          }
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          if (options.filters[0].namePrefix !== `BBC micro:bit [${microBitName}]`) {
            return Promise.reject(undefined);
          }
          return Promise.resolve(new MockBTDevice().build());
        },
      },
    });
  });

  test('can create connection', async () => {
    const mockBt = new MockBTDevice().withMicrobitVersion(2).build();
    const con = await MicrobitBluetooth.createMicrobitBluetooth(
      mockBt,
      TypingUtils.emptyFunction,
      TypingUtils.emptyFunction,
      TypingUtils.emptyFunction,
      TypingUtils.emptyFunction,
      TypingUtils.emptyFunction,
    );
    expect(con).toBeDefined();
  });

  test('Can read version', async () => {
    const mockBt1 = new MockBTDevice().withMicrobitVersion(1).build();
    const con1 = await MicrobitBluetooth.createMicrobitBluetooth(
      mockBt1,
      TypingUtils.emptyFunction,
      TypingUtils.emptyFunction,
      TypingUtils.emptyFunction,
      TypingUtils.emptyFunction,
      TypingUtils.emptyFunction,
    );
    expect(con1.getVersion()).toBe(1);

    const mockBt2 = new MockBTDevice().withMicrobitVersion(2).build();
    const con2 = await MicrobitBluetooth.createMicrobitBluetooth(
      mockBt2,
      TypingUtils.emptyFunction,
      TypingUtils.emptyFunction,
      TypingUtils.emptyFunction,
      TypingUtils.emptyFunction,
      TypingUtils.emptyFunction,
    );
    expect(con2.getVersion()).toBe(2);
  });

  test('On connect fires when connected', async () => {
    const mockBt = new MockBTDevice().build();
    let didFire = false;
    await MicrobitBluetooth.createMicrobitBluetooth(
      mockBt,
      () => (didFire = true),
      TypingUtils.emptyFunction,
      TypingUtils.emptyFunction,
      TypingUtils.emptyFunction,
      TypingUtils.emptyFunction,
    );
    expect(didFire).toBe(true);
  });

  test('onConnect does not fire when connection fails', async () => {
    const mockBt = new MockBTDevice().withFailingConnection().build();
    let didFire = false;
    try {
      await MicrobitBluetooth.createMicrobitBluetooth(
        mockBt,
        () => (didFire = true),
        TypingUtils.emptyFunction,
        TypingUtils.emptyFunction,
        TypingUtils.emptyFunction,
        TypingUtils.emptyFunction,
      );
    } catch (e) {
      TypingUtils.emptyFunction();
    }
    expect(didFire).toBe(false);
  });

  test('onConnectFailed is fired when connection fails', async () => {
    const mockBt = new MockBTDevice().withFailingConnection().build();
    let didFire = false;
    try {
      await MicrobitBluetooth.createMicrobitBluetooth(
        mockBt,
        TypingUtils.emptyFunction,
        TypingUtils.emptyFunction,
        () => (didFire = true),
        TypingUtils.emptyFunction,
        TypingUtils.emptyFunction,
      );
    } catch (e) {
      TypingUtils.emptyFunction();
    }
    expect(didFire).toBe(true);
  });

  test('onConnectFailed does not fire when connection succeeds', async () => {
    const mockBt: BluetoothDevice = new MockBTDevice().build();
    let didFire = false;
    await MicrobitBluetooth.createMicrobitBluetooth(
      mockBt,
      TypingUtils.emptyFunction,
      TypingUtils.emptyFunction,
      () => (didFire = true),
      TypingUtils.emptyFunction,
      TypingUtils.emptyFunction,
    );

    expect(didFire).toBe(false);
  });

  test('onDisconnect fires when gatt is disconnected', async () => {
    const mockBt: BluetoothDevice = new MockBTDevice().build();
    let didFire = false;
    await MicrobitBluetooth.createMicrobitBluetooth(
      mockBt,
      TypingUtils.emptyFunction,
      () => {
        didFire = true;
      },
      TypingUtils.emptyFunction,
      TypingUtils.emptyFunction,
      TypingUtils.emptyFunction,
    );

    mockBt.gatt!.disconnect();

    expect(didFire).toBe(true);
  });

  test('Request device yields device', async () => {
    const device = await MicrobitBluetooth.requestDevice(
      'vatav',
      TypingUtils.emptyFunction,
    );
    expect(device).toBeDefined();
  });

  test('Can connect to requested device', async () => {
    const device = await MicrobitBluetooth.requestDevice(
      'vatav',
      TypingUtils.emptyFunction,
    );

    const con = await MicrobitBluetooth.createMicrobitBluetooth(
      device,
      TypingUtils.emptyFunction,
      TypingUtils.emptyFunction,
      TypingUtils.emptyFunction,
      TypingUtils.emptyFunction,
      TypingUtils.emptyFunction,
    );
    expect(con).toBeDefined();
    expect(con.isConnected()).toBe(true);
  });
});
