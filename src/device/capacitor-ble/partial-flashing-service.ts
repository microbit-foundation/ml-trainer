import {
  BleClient,
  numbersToDataView,
  TimeoutOptions,
} from "@capacitor-community/bluetooth-le";
import MemoryMap from "nrf-intel-hex";
import { Device } from "./bluetooth";

const PARTIAL_FLASHING_SERVICE = "e97dd91d-251d-470a-a062-fa1922dfa9a8";
const PARTIAL_FLASH_CHARACTERISTIC = "e97d3b10-251d-470a-a062-fa1922dfa9a8";
const MICROBIT_RESET_COMMAND = 0xff;
const REGION_INFO_COMMAND = 0x0;
const FLASH_COMMAND = 0x1;

export const enum MicroBitMode {
  Pairing = 0x00,
  Application = 0x01,
}

export const enum RegionId {
  SoftDevice = 0x0,
  Dal = 0x1,
  MakeCode = 0x2,
}

export interface RegionInfo {
  start: number;
  end: number;
  hash: string;
}

export const enum PacketState {
  Retransmit = 0xaa,
  Success = 0xff,
}

export class PartialFlashingService {
  constructor(private device: Device) {}

  async startNotifications(options?: TimeoutOptions) {
    await this.device.startNotifications(
      PARTIAL_FLASHING_SERVICE,
      PARTIAL_FLASH_CHARACTERISTIC,
      options
    );
  }

  async stopNotifications() {
    await this.device.stopNotifications(
      PARTIAL_FLASHING_SERVICE,
      PARTIAL_FLASH_CHARACTERISTIC
    );
  }

  async resetToMode(mode: MicroBitMode): Promise<void> {
    await BleClient.writeWithoutResponse(
      this.device.deviceId,
      PARTIAL_FLASHING_SERVICE,
      PARTIAL_FLASH_CHARACTERISTIC,
      numbersToDataView([MICROBIT_RESET_COMMAND, mode])
    );
  }

  async getRegionInfo(region: RegionId): Promise<RegionInfo | null> {
    return parseRegionResponse(
      await this.device.writeForNotification(
        PARTIAL_FLASHING_SERVICE,
        PARTIAL_FLASH_CHARACTERISTIC,
        numbersToDataView([REGION_INFO_COMMAND, region]),
        REGION_INFO_COMMAND
      )
    );
  }

  /**
   * Writes a flash chunk.
   * Use writeFlashForNotification for every 4th chunk.
   */
  async writeFlash(
    source: MemoryMap,
    batchAddress: number,
    dataOffset: number,
    packetNumber: number,
    packetInBatch: number
  ) {
    return await BleClient.writeWithoutResponse(
      this.device.deviceId,
      PARTIAL_FLASHING_SERVICE,
      PARTIAL_FLASH_CHARACTERISTIC,
      this.createWriteDataCommand(
        source,
        batchAddress,
        dataOffset,
        packetNumber,
        packetInBatch
      )
    );
  }

  /**
   * Write a chunk and wait for a success/retransmit response.
   * The micro:bit notifies on every 4th chunk.
   */
  async writeFlashForNotification(
    source: MemoryMap,
    batchAddress: number,
    dataOffset: number,
    packetNumber: number,
    packetInBatch: number
  ): Promise<PacketState> {
    const result = await this.device.writeForNotification(
      PARTIAL_FLASHING_SERVICE,
      PARTIAL_FLASH_CHARACTERISTIC,
      this.createWriteDataCommand(
        source,
        batchAddress,
        dataOffset,
        packetNumber,
        packetInBatch
      ),
      FLASH_COMMAND,
      (notificationValue: Uint8Array) =>
        notificationValue[1] === PacketState.Success ||
        notificationValue[1] === PacketState.Retransmit
    );
    return result[1];
  }

  async writeEndOfFlashPacket() {
    return await BleClient.writeWithoutResponse(
      this.device.deviceId,
      PARTIAL_FLASHING_SERVICE,
      PARTIAL_FLASH_CHARACTERISTIC,
      numbersToDataView([0x02])
    );
  }

  private createWriteDataCommand(
    source: MemoryMap,
    batchAddress: number,
    dataOffset: number,
    packetNumber: number,
    packetInBatch: number
  ): DataView {
    const data = new DataView(new ArrayBuffer(20));
    data.setUint8(0, 0x01);

    // Bytes 1-2: offset encoding
    // Packet 0: low 16 bits of flash address
    // Packet 1: high 16 bits of flash address
    // Packets 2-3: offset within the 64-byte batch being written
    let offsetValue: number;
    if (packetInBatch === 0) {
      offsetValue = batchAddress & 0xffff;
    } else {
      // Note: for packets 2 and 3 the offset is unused.
      offsetValue = (batchAddress >> 16) & 0xffff;
    }

    data.setUint16(1, offsetValue);
    data.setUint8(3, packetNumber);

    const bytes = source.slicePad(dataOffset, 16);
    for (let i = 0; i < 16; ++i) {
      data.setUint8(4 + i, bytes[i]);
    }

    return data;
  }
}

const parseRegionResponse = (value: Uint8Array): RegionInfo | null => {
  const dataView = new DataView(
    value.buffer,
    value.byteOffset,
    value.byteLength
  );
  const start = dataView.getUint32(2, false);
  const end = dataView.getUint32(6, false);
  if (start === 0 || start >= end) {
    return null;
  }
  const hash = value.slice(10, 18);
  return { start, end, hash: bytesToHex(hash) };
};

const bytesToHex = (bytes: Uint8Array): string => {
  return Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, "0").toUpperCase())
    .join("");
};
