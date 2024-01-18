/*
 * (c), 2023 Arm Limited
 *
 *  SPDX-License-Identifier: MIT
 */

import { WebUSB } from 'dapjs';

const DEFAULT_SERIAL_DELAY = 20;
const DAP_WRITE_ABORT = 0x08;

enum AbortMask {
  /**
   * Generates a DAP abort, that aborts the current AP transaction
   */
  DAPABORT = 1 << 0,
  /**
   * Reserved
   */
  STKCMPCLR = 1 << 1,
  /**
   * Sets the STICKYERR sticky error flag to 0
   */
  STKERRCLR = 1 << 2,
  /**
   * Sets the WDATAERR write data error flag to 0
   */
  WDERRCLR = 1 << 3,
  /**
   * Sets the STICKYORUN overrun error flag to 0
   */
  ORUNERRCLR = 1 << 4,
}

enum DAPLinkSerial {
  READ_SETTINGS = 0x81,
  WRITE_SETTINGS = 0x82,
  READ = 0x83,
  WRITE = 0x84,
}

export class TypedEventTarget<T extends { [key: string]: Event }> {
  protected listeners: { [key: string]: Array<(event: T[keyof T]) => void> } = {};

  public addEventListener(
    type: keyof T,
    listener: (this: this, event: T[keyof T]) => void,
  ): void {
    const key = type as string;
    if (!this.listeners[key]) {
      this.listeners[key] = [];
    }
    this.listeners[key].push(listener);
  }

  public removeEventListener(
    type: keyof T,
    listener: (this: this, event: T[keyof T]) => void,
  ): void {
    const key = type as string;
    if (!this.listeners[key]) {
      return;
    }

    this.listeners[key] = this.listeners[key].filter(item => item !== listener);
  }

  public dispatchEvent(event: T[keyof T]): boolean {
    const toDispatch = this.listeners[event.type];

    if (toDispatch) {
      toDispatch.forEach(dispatch => dispatch(event));
    }

    return true;
  }
}

export type SerialEvents = {
  connect: Event;
  disconnect: Event;
};

export class WebUSBSerialDevice
  extends TypedEventTarget<SerialEvents>
  implements SerialPort
{
  public readable: ReadableStream<Uint8Array> | null = null;
  public writable: WritableStream<Uint8Array> | null = null;

  protected toWrite: Uint8Array | undefined;
  protected connected = false;

  constructor(
    protected device: WebUSB,
    protected serialDelay = DEFAULT_SERIAL_DELAY,
  ) {
    super();
  }

  public set onconnect(listener: (ev: Event) => void) {
    this.addEventListener('connect', listener);
  }

  public set ondisconnect(listener: (ev: Event) => void) {
    this.addEventListener('disconnect', listener);
  }

  public getInfo(): SerialPortInfo {
    // TODO get this from the USB Device?
    return {
      usbVendorId: 1, //this.device.vendorId,
      usbProductId: 1, //this.device.productId
    };
  }

  public async open(options: SerialOptions): Promise<void> {
    await this.connect();

    try {
      const view = new DataView(new ArrayBuffer(5));
      view.setUint8(0, DAPLinkSerial.WRITE_SETTINGS);
      view.setUint32(1, options.baudRate, true);
      await this.send(new Uint8Array(view.buffer));

      const result = await this.send(new Uint8Array([DAPLinkSerial.READ_SETTINGS]));
      if (!result) {
        throw new Error('No result for DAPLinkSerial.READ_SETTINGS');
      }

      const baudRate = result.getUint32(1, true);
      if (baudRate !== options.baudRate) {
        throw new Error(`Failed to set baudrate to ${options.baudRate}`);
      }
    } catch (error) {
      await this.clearAbort();
      throw error;
    }

    this.readable = new ReadableStream<Uint8Array>({
      start: this.start.bind(this),
    });

    this.writable = new WritableStream<Uint8Array>({
      write: this.write.bind(this),
    });
  }

  public async close(): Promise<void> {
    if (this.readable && !this.readable.locked) {
      await this.readable.cancel();
    }

    if (this.writable) {
      await this.writable.abort();
    }

    await this.disconnect();
  }

  public async setSignals(_signals: SerialOutputSignals): Promise<void> {
    // empty method
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  public async getSignals(): Promise<SerialInputSignals> {
    return {
      dataCarrierDetect: false,
      clearToSend: false,
      ringIndicator: false,
      dataSetReady: false,
    };
  }

  public async forget(): Promise<void> {
    // Do nothing
  }

  protected async start(
    controller: ReadableStreamDefaultController<Uint8Array>,
  ): Promise<void> {
    while (this.connected) {
      const serialData = await this.transfer();
      if (this.connected && serialData !== undefined) {
        controller.enqueue(new Uint8Array(serialData));
      }

      await new Promise(resolve => setTimeout(resolve, this.serialDelay));
    }
  }

  protected async write(
    chunk: Uint8Array,
    _controller: WritableStreamDefaultController,
  ): Promise<void> {
    this.toWrite = chunk;
    while (this.toWrite !== undefined) {
      await new Promise(resolve => setTimeout(resolve, 0));
    }
  }

  protected async transfer(): Promise<ArrayBuffer | undefined> {
    try {
      if (this.toWrite) {
        // Write chunk to DAPLink
        const writeArray = new Uint8Array(this.toWrite.byteLength + 2);
        writeArray.set([DAPLinkSerial.WRITE, this.toWrite.byteLength]);
        writeArray.set(this.toWrite, 2);
        await this.send(writeArray);
      }

      const view = await this.send(new Uint8Array([DAPLinkSerial.READ]));
      if (!view) {
        return undefined;
      }

      // Check if there is any data returned from the device
      if (view.byteLength === 0) {
        return undefined;
      }

      // Second byte contains the actual length of data read from the device
      const dataLength = view.getUint8(1);
      if (dataLength === 0) {
        return undefined;
      }

      const resultOffset = 2;
      return view.buffer.slice(resultOffset, resultOffset + dataLength);
    } catch (error) {
      await this.clearAbort();
      throw error;
    } finally {
      this.toWrite = undefined;
    }
  }

  protected async connect(): Promise<void> {
    await this.device.open();
    this.connected = true;
  }

  protected async disconnect(): Promise<void> {
    await this.device.close();
    this.connected = false;
  }

  protected async send(buffer: Uint8Array): Promise<DataView | undefined> {
    await this.device.write(buffer);
    const result = await this.device.read();

    if (result && result.getUint8(0) !== buffer[0]) {
      throw new Error(`Bad response for ${buffer[0]} -> ${result.getUint8(0)}`);
    }

    return result;
  }

  /**
   * Clears the abort register of all error flags
   * @param abortMask Optional AbortMask to use, otherwise clears all flags
   */
  public async clearAbort(
    abortMask: number = AbortMask.WDERRCLR |
      AbortMask.STKERRCLR |
      AbortMask.STKCMPCLR |
      AbortMask.ORUNERRCLR,
  ): Promise<void> {
    await this.send(
      new Uint8Array([
        DAP_WRITE_ABORT,
        0,
        abortMask & 0xff,
        (abortMask >> 8) & 0xff,
        (abortMask >> 16) & 0xff,
        (abortMask >> 24) & 0xff,
      ]),
    );
  }
}
