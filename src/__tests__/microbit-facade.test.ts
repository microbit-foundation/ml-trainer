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

describe('Microbit facade tests', () => {
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
          options?: RequestDeviceOptions & { filters?: { namePrefix: string }[] },
        ): Promise<BluetoothDevice> {
          const microBitName = 'vatav';
          if (!options) {
            return Promise.reject(undefined);
          }
          if (!options.filters) {
            return Promise.reject(undefined);
          }
          if (options.filters.length == 0) {
            return Promise.reject(undefined);
          }
          if (!options.filters[0].namePrefix) {
            return Promise.reject(undefined);
          }
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
      /* empty */
    }
  });

  test('Should give correct hex file', () => {
    expect(Microbits.hexFiles[1]).toBe('firmware/ml-microbit-cpp-version-combined.hex');
    expect(Microbits.hexFiles[2]).toBe('firmware/MICROBIT.hex');
    expect(Microbits.hexFiles['universal']).toBe('firmware/universal-hex.hex');
  });

  test('Input should not be connected before connecting', () => {
    expect(Microbits.isInputAssigned()).toBeFalsy();
  });

  test('Input should be connected after connecting', async () => {
    const wasConnected = await Microbits.assignBluetoothInput('vatav');
    expect(wasConnected).toBeTruthy();
    expect(Microbits.isInputAssigned()).toBeTruthy();
    expect(Microbits.isOutputAssigned()).toBeFalsy();
  });

  test('Output should not be connected before connecting', () => {
    expect(Microbits.isOutputAssigned()).toBeFalsy();
  });

  test('Output should be connected after connecting', async () => {
    const wasConnected = await Microbits.assignOutput('vatav');
    expect(wasConnected).toBeTruthy();
    expect(Microbits.isOutputAssigned()).toBeTruthy();
    expect(Microbits.isInputAssigned()).toBeFalsy();
  });

  test('Can get connected input', async () => {
    await Microbits.assignBluetoothInput('vatav');
    expect(Microbits.getAssignedInput()).toBeDefined();
  });

  test('Can get connected output', async () => {
    await Microbits.assignOutput('vatav');
    expect(Microbits.getAssignedOutput()).toBeDefined();
  });

  test('Should get correct name', async () => {
    await Microbits.assignOutput('vatav');
    await Microbits.assignBluetoothInput('vatav');
    expect(Microbits.getOutputName()).toBe('vatav');
    expect(Microbits.getInputName()).toBe('vatav');
  });

  test('Should get correct version', async () => {
    await Microbits.assignOutput('vatav');
    await Microbits.assignBluetoothInput('vatav');
    expect(Microbits.getInputVersion()).toBe(2);
    expect(Microbits.getOutputVersion()).toBe(2);
  });
});
