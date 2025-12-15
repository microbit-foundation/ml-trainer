import MemoryMap from "nrf-intel-hex";
import { delay, Device } from "./bluetooth";
import { DfuService, NORDIC_DFU_SERVICE } from "./dfu-service";
import { refreshServicesForV1IfDesiredServiceMissing } from "./flashing-v1";
import { FlashProgressStage, FlashResult, Progress } from "./model";
import { flashDfu } from "./nordic-dfu";
import { BoardVersion } from "@microbit/microbit-connection";

/**
 * Perform a full flash via Nordic's DFU service.
 *
 * The connection is closed before handing off to Nordic's service which will
 * connect again.
 *
 * The device is assumed to be bonded.
 */
export async function fullFlash(
  device: Device,
  boardVersion: BoardVersion,
  memoryMap: MemoryMap,
  progress: Progress
): Promise<FlashResult> {
  device.log("Full flash");
  progress(FlashProgressStage.Full);
  const { deviceId } = device;

  try {
    if (boardVersion === "V1") {
      device.log("Rebooting V1 to bootloader");

      const dfuService = new DfuService(device);
      try {
        await dfuService.requestRebootToBootloader();
      } catch (e) {
        device.log("Failed to request reboot to bootloader");
        device.error(e);
        return FlashResult.FullFlashFailed;
      }

      // Wait for device to automatically disconnect as it reboots into bootloader
      device.log("Waiting for device to reboot and disconnect");
      try {
        await device.waitForDisconnect(3000);
      } catch {
        device.log(
          "Device did not disconnect automatically, disconnecting manually"
        );
        await device.disconnect();
      }

      // Give device time to disconnect and reboot into bootloader mode
      await delay(2500);

      // Reconnect to device now in bootloader mode
      await device.connect("bootloader-mode");
      await refreshServicesForV1IfDesiredServiceMissing(
        deviceId,
        NORDIC_DFU_SERVICE
      );
    }
  } finally {
    // The Nordic code opens its own connection.
    await device.disconnect();
  }

  const appBin = createAppBin(memoryMap, boardVersion);
  if (appBin === null) {
    device.log("Invalid hex (app bin case)");
    return FlashResult.InvalidHex;
  }
  device.log(`Extracted app bin: ${appBin.length} bytes`);
  return flashDfu(device, boardVersion, appBin, progress);
}

const createAppBin = (
  memoryMap: MemoryMap,
  boardVersion: BoardVersion
): Uint8Array | null => {
  const appRegionBoundaries = {
    V1: { start: 0x18000, end: 0x3c000 },
    V2: { start: 0x1c000, end: 0x77000 },
  }[boardVersion];

  // Calculate data size within the app region
  let maxAddress = appRegionBoundaries.start;
  for (const [blockAddr, block] of memoryMap) {
    const blockEnd = blockAddr + block.length;
    if (
      blockEnd > appRegionBoundaries.start &&
      blockAddr < appRegionBoundaries.end
    ) {
      maxAddress = Math.max(
        maxAddress,
        Math.min(blockEnd, appRegionBoundaries.end)
      );
    }
  }

  let size = maxAddress - appRegionBoundaries.start;
  // 4-byte alignment required by DFU
  size = Math.ceil(size / 4) * 4;

  return memoryMap.slicePad(appRegionBoundaries.start, size);
};
