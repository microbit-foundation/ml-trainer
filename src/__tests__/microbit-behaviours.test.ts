/**
 * @vitest-environment jsdom
 */
/**
 * (c) 2023, Center for Computational Thinking and Design at Aarhus University and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import Microbits from '../script/microbit-interfacing/Microbits';
import ConnectionBehaviours from '../script/connection-behaviours/ConnectionBehaviours';
import OutputBehaviour from '../script/connection-behaviours/OutputBehaviour';
import InputBehaviour from '../script/connection-behaviours/InputBehaviour';
import SpyConnectionBehaviour from './mocks/SpyConnectionBehaviour';
import MockBTDevice from './mocks/mock-microbit-bluetooth';

describe('Microbit behaviours tests', () => {
  let spyInputBehaviour: SpyConnectionBehaviour;
  let spyOutputBehaviour: SpyConnectionBehaviour;

  beforeAll(() => {
    spyInputBehaviour = new SpyConnectionBehaviour();
    spyOutputBehaviour = new SpyConnectionBehaviour();
    ConnectionBehaviours.setOutputBehaviour(
      spyOutputBehaviour as unknown as OutputBehaviour,
    );
    ConnectionBehaviours.setInputBehaviour(
      spyInputBehaviour as unknown as InputBehaviour,
    );
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
          return Promise.resolve(new MockBTDevice().withMicrobitVersion(2).build());
        },
      },
    });
  });

  beforeEach(() => {
    try {
      Microbits.expelInputAndOutput();
    } catch (_e) {
      /*empty*/
    }
  });

  describe('input behaviour tests', () => {
    test('bluetoothConnect fires when connected', async () => {
      await Microbits.assignBluetoothInput('vatav');
      expect(spyInputBehaviour.hasConnectFired()).toBeTruthy();
      expect(spyInputBehaviour.getConnectedName()).toBe('vatav');
      expect(spyInputBehaviour.didFailConnection()).toBeFalsy();
    });

    test('bluetoothConnectionError fires when connection fails', async () => {
      await Microbits.assignBluetoothInput('noooo');
      expect(spyInputBehaviour.didFailConnection()).toBeTruthy();
    });

    test('bluetoothDisconnect fires when disconnected manually', async () => {
      await Microbits.assignBluetoothInput('vatav');
      Microbits.expelInput();
      expect(spyInputBehaviour.wasDisconnected()).toBeTruthy();
      expect(spyInputBehaviour.wasManuallyDisconnected()).toBeTruthy();
      expect(spyInputBehaviour.wasBothDisconnected()).toBeTruthy();
    });

    test('bluetoothDisconnect fires when both disconnected manually', async () => {
      await Microbits.assignBluetoothInput('vatav');
      Microbits.expelInputAndOutput();
      expect(spyInputBehaviour.wasDisconnected()).toBeTruthy();
      expect(spyInputBehaviour.wasManuallyDisconnected()).toBeTruthy();
      expect(spyInputBehaviour.wasBothDisconnected()).toBeTruthy();
    });
  });

  describe('Output behaviour tests', () => {
    test('bluetoothConnect fires when connected', async () => {
      await Microbits.assignOutput('vatav');
      expect(spyOutputBehaviour.hasConnectFired()).toBeTruthy();
      expect(spyOutputBehaviour.getConnectedName()).toBe('vatav');
      expect(spyOutputBehaviour.didFailConnection()).toBeFalsy();
    });

    test('bluetoothConnectionError fires when connection fails', async () => {
      await Microbits.assignOutput('noooo');
      expect(spyOutputBehaviour.didFailConnection()).toBeTruthy();
    });

    test('bluetoothDisconnect fires when disconnected manually', async () => {
      await Microbits.assignOutput('vatav');
      Microbits.expelOutput();
      expect(spyOutputBehaviour.wasDisconnected()).toBeTruthy();
      expect(spyOutputBehaviour.wasManuallyDisconnected()).toBeTruthy();
      expect(spyOutputBehaviour.wasBothDisconnected()).toBeTruthy();
    });

    test('bluetoothDisconnect fires when both disconnected manually', async () => {
      await Microbits.assignOutput('vatav');
      Microbits.expelInputAndOutput();
      expect(spyOutputBehaviour.wasDisconnected()).toBeTruthy();
      expect(spyOutputBehaviour.wasManuallyDisconnected()).toBeTruthy();
      expect(spyOutputBehaviour.wasBothDisconnected()).toBeTruthy();
    });
  });
});
