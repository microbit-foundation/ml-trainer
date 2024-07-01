/**
 * (c) 2023, Center for Computational Thinking and Design at Aarhus University and contributors
 *
 * SPDX-License-Identifier: MIT
 */

import { CortexM, DAPLink, WebUSB } from 'dapjs';
import { logError } from '../utils/logging';
import MBSpecs from './MBSpecs';
import { CortexSpecialReg } from './constants';

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
      logError('USB request device failed/cancelled', e);
      throw e;
    }
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
   * @returns {string} The device ID of the micro:bit from FICR.
   */
  public async getDeviceId(): Promise<number> {
    const debug = new CortexM(this.transport);
    try {
      await debug.connect();
      // Microbit only uses MSB of serial number
      return await debug.readMem32(MBSpecs.USBSpecs.FICR + MBSpecs.USBSpecs.DEVICE_ID_1);
    } catch (e: unknown) {
      logError('USB failed to read name', e);
      throw new Error('Failed to read name: ' + e);
    } finally {
      await debug.disconnect();
    }
  }

  /**
   * Resets the micro:bit in software by writing to NVIC_AIRCR.
   * Drawn from https://github.com/mmoskal/dapjs/blob/a32f11f54e9e76a9c61896ddd425c1cb1a29c143/src/cortex/cortex.ts#L347
   */
  public async softwareReset(): Promise<void> {
    const cortexM = new CortexM(this.transport);
    await cortexM.connect();
    await cortexM.writeMem32(
      CortexSpecialReg.NVIC_AIRCR,
      CortexSpecialReg.NVIC_AIRCR_VECTKEY | CortexSpecialReg.NVIC_AIRCR_SYSRESETREQ,
    );

    // wait for the system to come out of reset
    let dhcsr = await cortexM.readMem32(CortexSpecialReg.DHCSR);

    while ((dhcsr & CortexSpecialReg.S_RESET_ST) !== 0) {
      dhcsr = await cortexM.readMem32(CortexSpecialReg.DHCSR);
    }
    await cortexM.disconnect();
  }

  /**
   * Flashes array buffer to the micro:bit.
   * @param {buffer: ArrayBuffer} buffer Hex buffer to flash
   * @param {(progress: number) => void} progressCallback A callback for progress.
   */
  public async flashHex(
    buffer: ArrayBuffer,
    progressCallback: (progress: number) => void,
  ): Promise<void> {
    const target = new DAPLink(this.transport);

    target.on(DAPLink.EVENT_PROGRESS, (progress: number) => {
      progressCallback(progress);
    });

    try {
      await target.connect();
      await target.flash(buffer);
      await target.disconnect();
    } catch (e) {
      logError('Failed to flash hex', e);
      throw e;
    }
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
