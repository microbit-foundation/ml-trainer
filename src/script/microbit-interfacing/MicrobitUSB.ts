/**
 * (c) 2023, Center for Computational Thinking and Design at Aarhus University and contributors
 *
 * SPDX-License-Identifier: MIT
 */

import { CortexM, DAPLink, WebUSB } from 'dapjs';
import MBSpecs from './MBSpecs';

const baudRate = 115200;
const serialDelay = 5;

/**
 * A USB connection to a micro:bit.
 */
class MicrobitUSB extends CortexM {
  private readonly transport: WebUSB;
  private serialPromise: Promise<void> | undefined;
  private serialDAPLink: DAPLink | undefined;

  /**
   * Creates a new MicrobitUSB object.
   *
   * Use MicrobitUSB.requestConnection() or MicrobitUSB.createWithoutRequest() to create a new MicrobitUSB object.
   * @param usbDevice The USB device to connect to.
   * @protected constructor for internal use.
   */
  protected constructor(protected usbDevice: USBDevice) {
    const transport: WebUSB = new WebUSB(usbDevice);
    super(transport);
    this.transport = transport;
  }

  /**
   * Open prompt for USB connection.
   * @returns {Promise<MicrobitUSB>} A promise that resolves to a new MicrobitUSB object.
   */
  public static async requestConnection(): Promise<MicrobitUSB> {
    const requestOptions: USBDeviceRequestOptions = {
      filters: [
        {
          vendorId: MBSpecs.USBSpecs.VENDOR_ID,
          productId: MBSpecs.USBSpecs.PRODUCT_ID,
        },
      ],
    };

    try {
      const device: USBDevice = await navigator.usb.requestDevice(requestOptions);
      return new MicrobitUSB(device);
    } catch (e) {
      console.log(e);
      return Promise.reject(e);
    }
  }

  /**
   * Returns the USB serial number of the device
   */
  public getSerialNumber(): string {
    return this.usbDevice.serialNumber!.toString();
  }

  /**
   * Uses the serial number from dapjs to determine the model number of the board.
   * Read more: https://support.microbit.org/support/solutions/articles/19000035697-what-are-the-usb-vid-pid-numbers-for-micro-bit
   * @returns The hardware model of the micro:bit. Either 1 or 2.
   */
  public getModelNumber(): MBSpecs.MBVersion {
    const sernoPrefix: string = this.usbDevice.serialNumber!.toString().substring(0, 4);
    if (parseInt(sernoPrefix) < 9903) return 1;
    else return 2;
  }

  /**
   * @returns {string} The friendly name of the micro:bit.
   */
  public async getFriendlyName(): Promise<string> {
    let result = '';
    let err: unknown = undefined;
    try {
      await this.connect();
      // Microbit only uses MSB of serial number
      const serial = await this.readMem32(
        MBSpecs.USBSpecs.FICR + MBSpecs.USBSpecs.DEVICE_ID_1,
      );
      result = MBSpecs.Utility.serialNumberToName(serial);
    } catch (e: unknown) {
      console.log(e);
      err = e;
    } finally {
      await this.disconnect();
    }
    if (!result) {
      return Promise.reject(err);
    }
    return Promise.resolve(result);
  }

  /**
   * Flashes a .hex file to the micro:bit.
   * @param {string} hex The hex file to flash. (As a link)
   * @param {(progress: number) => void} progressCallback A callback for progress.
   */
  public async flashHex(
    hex: string,
    progressCallback: (progress: number) => void,
  ): Promise<void> {
    const hexFile: Response = await fetch(hex);
    const buffer: ArrayBuffer = await hexFile.arrayBuffer();

    const target = new DAPLink(this.transport);

    target.on(DAPLink.EVENT_PROGRESS, (progress: number) => {
      progressCallback(progress);
    });

    try {
      await target.connect();
      await target.flash(buffer);
      await target.disconnect();
    } catch (error) {
      console.log(error);
      return Promise.reject(error);
    }
    return Promise.resolve();
  }

  public async startSerial(callback: (data: string) => void) {
    await this.transport.open();

    this.serialDAPLink = new DAPLink(this.transport);
    const initialBaudRate = await this.serialDAPLink.getSerialBaudrate();
    this.serialDAPLink.addListener(DAPLink.EVENT_SERIAL_DATA, callback);
    await this.serialDAPLink.connect();
    if (initialBaudRate !== baudRate) {
      await this.serialDAPLink.setSerialBaudrate(baudRate);
    }
    this.serialPromise = this.serialDAPLink.startSerialRead(serialDelay, false);
  }

  public async serialWrite(data: string): Promise<void> {
    return this.serialDAPLink?.serialWrite(data);
  }

  isSerialConnected(): boolean {
    return !!this.serialPromise;
  }

  public async stopSerial() {
    if (this.serialDAPLink) {
      this.serialDAPLink.stopSerialRead();
      await this.serialPromise;
      this.serialPromise = undefined;
      await this.serialDAPLink.disconnect();
      this.serialDAPLink = undefined;
    }
  }
}

export default MicrobitUSB;
