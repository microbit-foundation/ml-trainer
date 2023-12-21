/**
 * @vitest-environment jsdom
 */
/**
 * (c) 2023, Center for Computational Thinking and Design at Aarhus University and contributors
 *
 * SPDX-License-Identifier: MIT
 */

import MockUSBDevice, { TestableMicrobitUSB } from './mocks/mock-usb';

describe('Microbit USB connection tests', () => {
  beforeAll(() => {
    /** Adds the usb property to the navigator for mocking */
    Object.assign(navigator, {
      usb: {
        predefined: undefined,
        requestDevice(options?: USBDeviceRequestOptions): any {
          const result = this.predefined
            ? this.predefined
            : Promise.resolve(new MockUSBDevice().build());
          this.predefined = undefined;
          return Promise.resolve(result);
        },
      },
    });
  });

  test('Can connect read serial', async () => {
    const mockUsbDevice = new MockUSBDevice().withSerialNumber('123test').build();
    const connection = new TestableMicrobitUSB(mockUsbDevice);
    expect(connection.getSerialNumber()).toBe('123test');
  });

  test('Serial number 9900 should be a version 1', async () => {
    const mockUsbDevice = new MockUSBDevice().withSerialNumber('9900serno').build();
    const connection = new TestableMicrobitUSB(mockUsbDevice);
    expect(connection.getModelNumber()).toBe(1);
  });

  test('Serial number 9901 should be a version 1', async () => {
    const mockUsbDevice = new MockUSBDevice().withSerialNumber('9901serno').build();
    const connection = new TestableMicrobitUSB(mockUsbDevice);
    expect(connection.getModelNumber()).toBe(1);
  });

  test('Serial number 9903 should be a version 2', async () => {
    const mockUsbDevice = new MockUSBDevice().withSerialNumber('9903serno').build();
    const connection = new TestableMicrobitUSB(mockUsbDevice);
    expect(connection.getModelNumber()).toBe(2);
  });

  test('Serial number 9904 should be a version 2', async () => {
    const mockUsbDevice = new MockUSBDevice().withSerialNumber('9904serno').build();
    const connection = new TestableMicrobitUSB(mockUsbDevice);
    expect(connection.getModelNumber()).toBe(2);
  });
});
