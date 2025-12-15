import MemoryMap from "nrf-intel-hex";
import { delay, Device, DisconnectError } from "./bluetooth";
import { findMakeCodeRegionInMemoryMap } from "./flashing-makecode";
import { FlashProgressStage, Progress } from "./model";
import {
  PacketState,
  PartialFlashingService,
  RegionId,
} from "./partial-flashing-service";

export enum PartialFlashResult {
  Success = "Success",
  Failed = "Failed",
  AttemptFullFlash = "AttemptFullFlash",
  FailedToConnect = "FailedToConnect",
}

const partialFlash = async (
  device: Device,
  memoryMap: MemoryMap,
  progress: Progress
): Promise<PartialFlashResult> => {
  const pf = new PartialFlashingService(device);
  await pf.startNotifications();

  const result = await device.raceDisconnectAndTimeout(
    partialFlashInternal(device, pf, memoryMap, progress),
    { timeout: 30_000, actionName: "partial flash" }
  );

  try {
    await pf.stopNotifications();
  } catch (e) {
    // V1 disconnects quickly after a partial flash.
    if (!(e instanceof DisconnectError)) {
      device.log(`Warning: Error stopping notifications`);
      device.error(e);
    }
  }

  return result;
};

const partialFlashInternal = async (
  device: Device,
  pf: PartialFlashingService,
  memoryMap: MemoryMap,
  progress: Progress
): Promise<PartialFlashResult> => {
  device.log("Partial flash");
  progress(FlashProgressStage.Partial);
  try {
    const deviceCodeRegion = await pf.getRegionInfo(RegionId.MakeCode);
    if (deviceCodeRegion === null) {
      device.log("Could not read code region");
      return PartialFlashResult.AttemptFullFlash;
    }

    const deviceDalRegion = await pf.getRegionInfo(RegionId.Dal);
    if (deviceDalRegion === null) {
      device.log("Could not read DAL region");
      return PartialFlashResult.AttemptFullFlash;
    }

    const fileCodeRegion = findMakeCodeRegionInMemoryMap(
      memoryMap,
      deviceCodeRegion
    );
    if (fileCodeRegion === null) {
      device.log("No partial flash data");
      return PartialFlashResult.AttemptFullFlash;
    }

    if (fileCodeRegion.hash !== deviceDalRegion.hash) {
      device.log(
        `DAL hash comparison failed. Hex: ${fileCodeRegion.hash} vs device: ${deviceDalRegion.hash}`
      );
      return PartialFlashResult.AttemptFullFlash;
    }
    if (deviceCodeRegion.start !== fileCodeRegion.start) {
      device.log("Code start address doesn't match");
      return PartialFlashResult.AttemptFullFlash;
    }

    let nextPacketNumber = 0;
    outer: for (
      let offset = fileCodeRegion.start;
      offset < fileCodeRegion.end;

    ) {
      const batchStartAddress = offset;

      for (let packetInBatch = 0; packetInBatch < 4; ++packetInBatch) {
        const packetNumber = nextPacketNumber++;
        const packetDataOffset = offset + packetInBatch * 16;

        if (packetInBatch < 3) {
          await pf.writeFlash(
            memoryMap,
            batchStartAddress,
            packetDataOffset,
            packetNumber,
            packetInBatch
          );
        } else {
          const result = await pf.writeFlashForNotification(
            memoryMap,
            batchStartAddress,
            packetDataOffset,
            packetNumber,
            packetInBatch
          );
          if (result === PacketState.Retransmit) {
            // Retry the whole 64 bytes.
            device.log(`Retransmit requested at offset ${offset}`);
            continue outer;
          } else {
            progress(
              FlashProgressStage.Partial,
              Math.round(
                ((offset - fileCodeRegion.start) /
                  (fileCodeRegion.end - fileCodeRegion.start)) *
                  100
              )
            );
          }
        }
      }
      offset += 64;
    }

    await delay(100); // allow time for write to complete
    await pf.writeEndOfFlashPacket();
    await delay(100); // allow time for write to complete
    progress(FlashProgressStage.Partial, 100);

    return PartialFlashResult.Success;
  } catch (e) {
    device.error(e);
    return PartialFlashResult.Failed;
  }
};

export default partialFlash;
