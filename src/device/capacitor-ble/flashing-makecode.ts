import MemoryMap from "nrf-intel-hex";
import { RegionInfo } from "./partial-flashing-service";

const PXT_MAGIC_HEX = "708E3B92C615A841C49866C975EE5197";

/**
 * Find the MakeCode code region in a MemoryMap (typically from a hex file).
 */
export const findMakeCodeRegionInMemoryMap = (
  memoryMap: MemoryMap,
  deviceCodeRegion: RegionInfo
): RegionInfo | null => {
  for (const [blockAddr, block] of memoryMap) {
    const offset = findByteSequence(block, PXT_MAGIC_HEX);
    if (offset >= 0) {
      const start = blockAddr + offset;
      const hashOffset = start + PXT_MAGIC_HEX.length / 2;
      const hashBytes = memoryMap.slicePad(hashOffset, 8);
      const hash = bytesToHex(hashBytes);

      // Find the highest address with data in the memory map within the code region
      let end = start;
      for (const [blockAddr, block] of memoryMap) {
        const blockEnd = blockAddr + block.length;
        if (blockEnd > start && blockAddr < deviceCodeRegion.end) {
          end = Math.max(end, Math.min(blockEnd, deviceCodeRegion.end));
        }
      }
      // Round up to next 64-byte boundary
      end = Math.ceil(end / 64) * 64;

      return { start, end, hash };
    }
  }
  return null;
};

const bytesToHex = (bytes: Uint8Array): string => {
  return Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, "0").toUpperCase())
    .join("");
};

function findByteSequence(data: Uint8Array, hexTarget: string): number {
  const target = new Uint8Array(
    hexTarget.match(/.{1,2}/g)!.map((byte) => parseInt(byte, 16))
  );

  outer: for (let i = 0; i <= data.length - target.length; i++) {
    for (let j = 0; j < target.length; j++) {
      if (data[i + j] !== target[j]) continue outer;
    }
    return i;
  }

  return -1;
}
