/**
 * (c) 2023, Center for Computational Thinking and Design at Aarhus University and contributors
 *
 * SPDX-License-Identifier: MIT
 */

import MBSpecs from '../../script/microbit-interfacing/MBSpecs';
import { MockBluetoothCharacteristicProperties } from './mock-bluetooth';

class MockInfoService implements BluetoothRemoteGATTService {
  readonly device: BluetoothDevice;
  readonly isPrimary: boolean = false;
  readonly uuid: string = '';
  modelNumberCharacteristic: BluetoothRemoteGATTCharacteristic =
    new MockBluetoothModelNumberCharacteristic(0, this);

  constructor(device: any) {
    this.device = device;
  }

  oncharacteristicvaluechanged(ev: Event): any {}

  onserviceadded(ev: Event): any {}

  onservicechanged(ev: Event): any {}

  onserviceremoved(ev: Event): any {}

  withModelNumber(modelNumberCharacteristic: BluetoothRemoteGATTCharacteristic) {
    this.modelNumberCharacteristic = modelNumberCharacteristic;
    return this;
  }

  addEventListener(
    type: 'serviceadded',
    listener: (this: this, ev: Event) => any,
    useCapture?: boolean,
  ): void;
  addEventListener(
    type: 'servicechanged',
    listener: (this: this, ev: Event) => any,
    useCapture?: boolean,
  ): void;
  addEventListener(
    type: 'serviceremoved',
    listener: (this: this, ev: Event) => any,
    useCapture?: boolean,
  ): void;
  addEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
    useCapture?: boolean,
  ): void;
  addEventListener(
    type: string,
    callback: EventListenerOrEventListenerObject | null,
    options?: AddEventListenerOptions | boolean,
  ): void;
  addEventListener(
    type: string,
    callback: EventListenerOrEventListenerObject | null,
    options?: AddEventListenerOptions | boolean,
  ): void;
  addEventListener(
    type: 'serviceadded' | 'servicechanged' | 'serviceremoved' | string,
    listener:
      | ((this: this, ev: Event) => any)
      | EventListenerOrEventListenerObject
      | null,
    useCapture?: boolean | AddEventListenerOptions,
  ): void {}

  dispatchEvent(event: Event): boolean;
  dispatchEvent(event: Event): boolean;
  dispatchEvent(event: Event): boolean {
    return false;
  }

  getCharacteristic(
    characteristic: BluetoothCharacteristicUUID,
  ): Promise<BluetoothRemoteGATTCharacteristic> {
    if (characteristic === MBSpecs.Characteristics.MODEL_NUMBER) {
      return Promise.resolve(this.modelNumberCharacteristic);
    }
    return Promise.reject(undefined);
  }

  getCharacteristics(
    characteristic?: BluetoothCharacteristicUUID,
  ): Promise<BluetoothRemoteGATTCharacteristic[]> {
    return Promise.resolve([]);
  }

  getIncludedService(service: BluetoothServiceUUID): Promise<BluetoothRemoteGATTService> {
    return Promise.reject(undefined);
  }

  getIncludedServices(
    service?: BluetoothServiceUUID,
  ): Promise<BluetoothRemoteGATTService[]> {
    return Promise.resolve([]);
  }

  removeEventListener(
    type: string,
    callback: EventListenerOrEventListenerObject | null,
    options?: EventListenerOptions | boolean,
  ): void;
  removeEventListener(
    type: string,
    callback: EventListenerOrEventListenerObject | null,
    options?: EventListenerOptions | boolean,
  ): void;
  removeEventListener(
    type: string,
    callback: EventListenerOrEventListenerObject | null,
    options?: EventListenerOptions | boolean,
  ): void {}
}

export class MockBluetoothModelNumberCharacteristic
  implements BluetoothRemoteGATTCharacteristic
{
  readonly properties: BluetoothCharacteristicProperties =
    new MockBluetoothCharacteristicProperties();
  readonly service: BluetoothRemoteGATTService;
  readonly uuid: string = '';

  constructor(
    public versionNumber: number,
    service: BluetoothRemoteGATTService,
  ) {
    this.service = service;
  }

  oncharacteristicvaluechanged(ev: Event): any {}

  addEventListener(
    type: 'characteristicvaluechanged',
    listener: (this: this, ev: Event) => any,
    useCapture?: boolean,
  ): void;
  addEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
    useCapture?: boolean,
  ): void;
  addEventListener(
    type: string,
    callback: EventListenerOrEventListenerObject | null,
    options?: AddEventListenerOptions | boolean,
  ): void;
  addEventListener(
    type: string,
    callback: EventListenerOrEventListenerObject | null,
    options?: AddEventListenerOptions | boolean,
  ): void;
  addEventListener(
    type: 'characteristicvaluechanged' | string,
    listener:
      | ((this: this, ev: Event) => any)
      | EventListenerOrEventListenerObject
      | null,
    useCapture?: boolean | AddEventListenerOptions,
  ): void {}

  dispatchEvent(event: Event): boolean;
  dispatchEvent(event: Event): boolean;
  dispatchEvent(event: Event): boolean {
    return false;
  }

  getDescriptor(
    descriptor: BluetoothDescriptorUUID,
  ): Promise<BluetoothRemoteGATTDescriptor> {
    return Promise.reject(undefined);
  }

  getDescriptors(
    descriptor?: BluetoothDescriptorUUID,
  ): Promise<BluetoothRemoteGATTDescriptor[]> {
    return Promise.resolve([]);
  }

  readValue(): Promise<DataView> {
    const v2VersionString = 'BBC micro:bit V2.0';
    const v1VersionString = 'BBC micro:bit';

    const selectedVersionString =
      this.versionNumber === 1 ? v1VersionString : v2VersionString;
    const enc = new TextEncoder();
    const buff = enc.encode(selectedVersionString);
    const dataView = new DataView(buff.buffer);
    return Promise.resolve(dataView);
  }

  removeEventListener(
    type: string,
    callback: EventListenerOrEventListenerObject | null,
    options?: EventListenerOptions | boolean,
  ): void;
  removeEventListener(
    type: string,
    callback: EventListenerOrEventListenerObject | null,
    options?: EventListenerOptions | boolean,
  ): void;
  removeEventListener(
    type: string,
    callback: EventListenerOrEventListenerObject | null,
    options?: EventListenerOptions | boolean,
  ): void {}

  startNotifications(): Promise<BluetoothRemoteGATTCharacteristic> {
    return Promise.reject(undefined);
  }

  stopNotifications(): Promise<BluetoothRemoteGATTCharacteristic> {
    return Promise.reject(undefined);
  }

  writeValue(value: BufferSource): Promise<void> {
    return Promise.resolve(undefined);
  }

  writeValueWithResponse(value: BufferSource): Promise<void> {
    return Promise.resolve(undefined);
  }

  writeValueWithoutResponse(value: BufferSource): Promise<void> {
    return Promise.resolve(undefined);
  }
}

export default MockInfoService;
