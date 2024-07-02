/**
 * (c) 2023, Center for Computational Thinking and Design at Aarhus University and contributors
 *
 * SPDX-License-Identifier: MIT
 */

import { DAPLink } from "dapjs";
import { Logging } from "../logging/logging";
import { DAPWrapper } from "./dap-wrapper";
import { MicrobitVersion } from "./device";

export const CortexSpecialReg = {
  // Debug Halting Control and Status Register
  DHCSR: 0xe000edf0,
  S_RESET_ST: 1 << 25,

  NVIC_AIRCR: 0xe000ed0c,
  NVIC_AIRCR_VECTKEY: 0x5fa << 16,
  NVIC_AIRCR_SYSRESETREQ: 1 << 2,

  // Many more.
};

/**
 * A USB connection to a micro:bit.
 */
class MicrobitWebUSBConnection {
  private logging: Logging;
  private device: USBDevice | undefined; // Undefined if disconnected
  private connection: DAPWrapper | undefined;

  /**
   * Creates a new MicrobitUSB object.
   */
  constructor(logging: Logging) {
    this.logging = logging;
  }

  public async connect() {
    const device = await this.chooseDevice();
    this.connection = new DAPWrapper(device, this.logging);
  }

  private async chooseDevice(): Promise<USBDevice> {
    if (this.device) {
      return this.device;
    }
    this.device = await navigator.usb.requestDevice({
      filters: [{ vendorId: 3368, productId: 516 }],
    });
    return this.device;
  }

  private logError(message: string, e: unknown) {
    this.logging.error(`${message}: ${JSON.stringify(e)}`);
  }

  getBoardVersion(): MicrobitVersion | null {
    if (!this.connection) {
      return null;
    }
    const boardId = this.connection.boardSerialInfo.id;
    return boardId.isV1() ? 1 : boardId.isV2() ? 2 : null;
  }

  getDeviceId(): string | null {
    if (!this.connection) {
      return null;
    }
    return this.connection.boardSerialInfo.id.toString();
  }

  /**
   * Resets the micro:bit in software by writing to NVIC_AIRCR.
   * Drawn from https://github.com/mmoskal/dapjs/blob/a32f11f54e9e76a9c61896ddd425c1cb1a29c143/src/cortex/cortex.ts#L347
   */
  public async softwareReset(): Promise<void> {
    await this.connection?.reset();
  }

  /**
   * Flashes a .hex file to the micro:bit.
   * @param {string} url The hex file to flash. (As a link)
   * @param {(progress: number) => void} progressCallback A callback for progress.
   */
  public async flashHex(
    url: string,
    progressCallback: (progress: number) => void
  ): Promise<void> {
    if (!this.connection) {
      throw new Error("Must be connected now");
    }
    const hexFile = await fetch(url);
    const buffer = await hexFile.arrayBuffer();
    const target = new DAPLink(this.connection?.transport);

    target.on(DAPLink.EVENT_PROGRESS, (progress: number) => {
      progressCallback(progress);
    });

    try {
      await target.connect();
      await target.flash(buffer);
      await target.disconnect();
    } catch (e) {
      this.logError("Failed to flash hex", e);
      throw e;
    }
  }
}

export default MicrobitWebUSBConnection;
