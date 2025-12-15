import { BleDevice } from "@capacitor-community/bluetooth-le";
import { DfuState, NordicDfu } from "@microbit/capacitor-community-nordic-dfu";
import { FlashProgressStage, FlashResult, Progress } from "./model";
import { Directory, Filesystem, WriteFileOptions } from "@capacitor/filesystem";
import JSZip from "jszip";
import { Capacitor, PluginListenerHandle } from "@capacitor/core";
import { BoardVersion } from "@microbit/microbit-connection";

const appBinFilename = "application.bin";
const appDatFilename = "application.dat";
const manifestData = JSON.stringify({
  manifest: {
    application: {
      bin_file: appBinFilename,
      dat_file: appDatFilename,
    },
  },
});

function uint8ArrayToBase64(uint8Array: Uint8Array): string {
  let binary = "";
  const len = uint8Array.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(uint8Array[i]);
  }
  return btoa(binary);
}

async function writeCacheFile(options: Omit<WriteFileOptions, "directory">) {
  const directory = Directory.Cache;
  const { uri } = await Filesystem.writeFile({ directory, ...options });
  return uri;
}

async function createDfuZipFile(
  boardVersion: BoardVersion,
  appBin: Uint8Array
): Promise<string> {
  const zip = new JSZip();
  const createInitPacket =
    boardVersion === "V1" ? createLegacyInitPacketV1 : createInitPacketV2;
  zip.file(appDatFilename, createInitPacket(appBin));
  zip.file(appBinFilename, appBin);
  zip.file("manifest.json", manifestData);

  const zipDataAsUint8Array = await zip.generateAsync({
    type: "uint8array",
    compression: "DEFLATE",
    compressionOptions: { level: 9 },
  });

  return await writeCacheFile({
    path: "dfu.zip",
    data: uint8ArrayToBase64(zipDataAsUint8Array),
  });
}

async function getFilePath(
  boardVersion: BoardVersion,
  appBin: Uint8Array
): Promise<{ uri: string; filename: string }> {
  const uri = await createDfuZipFile(boardVersion, appBin);
  return { uri, filename: "dfu.zip" };
}

async function cleanupTemporaryFile(filename: string): Promise<void> {
  try {
    await Filesystem.deleteFile({
      directory: Directory.Cache,
      path: filename,
    });
  } catch (error) {
    // File might not exist or already deleted, ignore errors
    console.log(`Could not delete temporary file ${filename}:`, error);
  }
}

export async function flashDfu(
  device: BleDevice,
  boardVersion: BoardVersion,
  appBin: Uint8Array,
  progress: Progress
): Promise<FlashResult> {
  const { uri: filePath, filename } = await getFilePath(boardVersion, appBin);
  let listener: PluginListenerHandle | undefined;
  try {
    // eslint-disable-next-line no-async-promise-executor
    return await new Promise(async (resolve) => {
      listener = await NordicDfu.addListener(
        "DFUStateChanged",
        ({ state, data }) => {
          switch (state) {
            case DfuState.DFU_COMPLETED: {
              resolve(FlashResult.Success);
              break;
            }
            case DfuState.DFU_ABORTED: {
              resolve(FlashResult.Cancelled);
              break;
            }
            case DfuState.DFU_PROGRESS: {
              progress(FlashProgressStage.Full, data.percent);
              break;
            }
            case DfuState.DFU_FAILED: {
              resolve(FlashResult.FullFlashFailed);
              break;
            }
            default: {
              console.log(`DFU state: ${state}`);
            }
          }
        }
      );
      // Note this doesn't await the whole DFU process, just its initialization
      const error = await NordicDfu.startDFU({
        deviceName: device.name,
        deviceAddress: device.deviceId,
        filePath,
        dfuOptions:
          Capacitor.getPlatform() === "android"
            ? {
                ...{
                  V1: { forceDfu: true },
                  V2: {
                    unsafeExperimentalButtonlessServiceInSecureDfuEnabled: true,
                    disableNotification: true,
                    restoreBond: true,
                  },
                }[boardVersion],
                startAsForegroundService: false,
                keepBond: true,
                packetReceiptNotificationsEnabled: true,
              }
            : {},
      });
      if (error) {
        console.log(`DFU Error: ${error.message}`);
        resolve(FlashResult.FullFlashFailed);
      }
      // Final resolution will come from listener callbacks.
    });
  } finally {
    await listener?.remove();
    await cleanupTemporaryFile(filename);
  }
}

const createLegacyInitPacketV1 = (appData: Uint8Array): Uint8Array => {
  // Legacy DFU init packet structure for micro:bit V1
  // Based on: dev-type 0xFFFF, dev-revision 0xFFFFFFFF, application-version 0xFFFFFFFF, sd-req 0x64

  const buffer = new ArrayBuffer(14);
  const view = new DataView(buffer);
  const uint8View = new Uint8Array(buffer);

  let offset = 0;

  // Device Type (2 bytes, little-endian) - 0xFFFF (wildcard)
  view.setUint16(offset, 0xffff, true);
  offset += 2;

  // Device Revision (2 bytes, little-endian) - 0xFFFF (wildcard, truncated from 0xFFFFFFFF)
  view.setUint16(offset, 0xffff, true);
  offset += 2;

  // Application Version (4 bytes, little-endian) - 0xFFFFFFFF (wildcard)
  view.setUint32(offset, 0xffffffff, true);
  offset += 4;

  // SoftDevice length (2 bytes, little-endian) - 1 (one SoftDevice requirement)
  view.setUint16(offset, 1, true);
  offset += 2;

  // SoftDevice requirement (2 bytes, little-endian) - 0x0064 (S110 v10.0)
  view.setUint16(offset, 0x0064, true);
  offset += 2;

  // CRC-16 of the application (2 bytes, little-endian)
  const crc16 = calculateCRC16(appData);
  view.setUint16(offset, crc16, true);

  return uint8View;
};

const calculateCRC16 = (data: Uint8Array): number => {
  // CRC-16/CCITT-FALSE (polynomial 0x1021, initial value 0xFFFF)
  let crc = 0xffff;

  for (let i = 0; i < data.length; i++) {
    crc ^= data[i] << 8;

    for (let j = 0; j < 8; j++) {
      if (crc & 0x8000) {
        crc = (crc << 1) ^ 0x1021;
      } else {
        crc = crc << 1;
      }
    }
  }

  return crc & 0xffff;
};

const createInitPacketV2 = (appBin: Uint8Array): Uint8Array => {
  //typedef struct {
  //    uint8_t  magic[12];                 // identify this struct "microbit_app"
  //    uint32_t version;                   // version of this struct == 1
  //    uint32_t app_size;                  // only used for DFU_FW_TYPE_APPLICATION
  //    uint32_t hash_size;                 // 32 => DFU_HASH_TYPE_SHA256 or zero to bypass hash check
  //    uint8_t  hash_bytes[32];            // hash of whole DFU download
  //} microbit_dfu_app_t;
  const appSize = appBin.length;
  const magic = "microbit_app";
  const version = 1;
  const hashSize = 0;
  const hash = new Uint8Array(32).fill(0);

  const buffer = new ArrayBuffer(12 + 4 + 4 + 4 + 32); // total: 56 bytes
  const view = new DataView(buffer);
  const uint8View = new Uint8Array(buffer);

  let offset = 0;

  // Write magic string (12 bytes)
  const encoder = new TextEncoder();
  const magicBytes = encoder.encode(magic);
  uint8View.set(magicBytes, offset);
  offset += 12;

  // Write version (4 bytes, little-endian)
  view.setUint32(offset, version, true);
  offset += 4;

  // Write appSize (4 bytes, little-endian)
  view.setUint32(offset, appSize, true);
  offset += 4;

  // Write hashSize (4 bytes, little-endian)
  view.setUint32(offset, hashSize, true);
  offset += 4;

  // Write hash (32 bytes)
  uint8View.set(hash, offset);

  return uint8View;
};
