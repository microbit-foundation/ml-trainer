/**
 * (c) 2023, Center for Computational Thinking and Design at Aarhus University and contributors
 *
 * SPDX-License-Identifier: MIT
 */

import { CortexM, DAPLink, WebUSB } from 'dapjs';
import MBSpecs from './MBSpecs';
import { HexType, getHexFileUrl } from './Microbits';

const baudRate = 115200;
const serialDelay = 5;

/**
 * A USB connection to a micro:bit.
 */
class MicrobitUSB {
  private readonly transport: WebUSB;
  private serialPromise: Promise<void> | undefined;
  private serialDAPLink: DAPLink | undefined;
  private serialCallbacks:
    | {
        data: (data: string) => void;
        error: (e: unknown) => void;
      }
    | undefined;

  /**
   * Creates a new MicrobitUSB object.
   *
   * Use MicrobitUSB.requestConnection() or MicrobitUSB.createWithoutRequest() to create a new MicrobitUSB object.
   * @param usbDevice The USB device to connect to.
   * @protected constructor for internal use.
   */
  protected constructor(protected usbDevice: USBDevice) {
    this.transport = new WebUSB(usbDevice);
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
    const debug = new CortexM(this.transport);
    try {
      await debug.connect();
      // Microbit only uses MSB of serial number
      const serial = await debug.readMem32(
        MBSpecs.USBSpecs.FICR + MBSpecs.USBSpecs.DEVICE_ID_1,
      );
      return MBSpecs.Utility.serialNumberToName(serial);
    } catch (e: unknown) {
      throw new Error('Failed to read name: ' + e);
    } finally {
      await debug.disconnect();
    }
  }

  /**
   * Flashes a .hex file to the micro:bit.
   * @param {string} hex The hex file to flash. (As a link)
   * @param {(progress: number) => void} progressCallback A callback for progress.
   */
  public async flashHex(
    hexType: HexType,
    progressCallback: (progress: number) => void,
  ): Promise<void> {
    const version = this.getModelNumber();
    const hex = getHexFileUrl(version, hexType);
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

  public async startSerial(
    dataCallback: (data: string) => void,
    errorCallback: (e: unknown) => void,
  ) {
    await this.transport.open();

    this.serialCallbacks = { data: dataCallback, error: errorCallback };
    this.serialDAPLink = new DAPLink(this.transport);
    const initialBaudRate = await this.serialDAPLink.getSerialBaudrate();
    this.serialDAPLink.addListener(DAPLink.EVENT_SERIAL_DATA, dataCallback);
    await this.serialDAPLink.connect();
    if (initialBaudRate !== baudRate) {
      await this.serialDAPLink.setSerialBaudrate(baudRate);
    }
    this.serialPromise = this.serialDAPLink
      .startSerialRead(serialDelay, false)
      .catch(e => {
        // Indirect so we can remove the callback as part of disconnect
        this.serialCallbacks?.error(e);
      });
  }

  public async serialWrite(data: string): Promise<void> {
    return this.serialDAPLink?.serialWrite(data);
  }

  isSerialConnected(): boolean {
    return !!this.serialPromise;
  }

  public async stopSerial() {
    if (this.serialDAPLink) {
      if (this.serialCallbacks) {
        this.serialDAPLink.removeListener(
          DAPLink.EVENT_SERIAL_DATA,
          this.serialCallbacks.data,
        );
        this.serialCallbacks = undefined;
      }
      this.serialDAPLink.stopSerialRead();
      try {
        await this.serialPromise;
      } catch (e) {
        // Errors from here will be handled by the error callback
        // in normal operation or can be ignored during disconnect.
      }
      this.serialPromise = undefined;
      try {
        await this.serialDAPLink.disconnect();
      } catch (e) {
        // If the micro:bit has gone away then this will fail.
      }
      this.serialDAPLink = undefined;
    }
  }
}

export default MicrobitUSB;
