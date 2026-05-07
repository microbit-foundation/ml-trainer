/**
 * (c) 2026, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { Encoding, Directory, Filesystem } from "@capacitor/filesystem";
import { Share } from "@capacitor/share";
import { HexData } from "../model";
import { isIOS } from "../platform";

const shareFromDirectory = "share";
const tempStorageLocation = Directory.Temporary;

/**
 * Share an arbitrary text file via the native share sheet.
 */
export const shareFile = async (
  filename: string,
  data: string,
  title: string,
  text: string
) => {
  await cleanOldFiles();

  const { uri: url } = await Filesystem.writeFile({
    path: `${shareFromDirectory}/${filename}`,
    data,
    encoding: Encoding.UTF8,
    directory: tempStorageLocation,
    recursive: true,
  });

  // On iOS, UIActivityViewController treats `text` as a separate shareable
  // item alongside the file, so saving via the share sheet produces an
  // unwanted extra "text" file. Android uses EXTRA_TEXT which is handled
  // correctly as message body metadata, so we keep it there.
  await Share.share({
    title,
    ...(isIOS() ? {} : { text }),
    files: [url],
  });
};

export const shareHex = async (hex: HexData) => {
  await shareFile(
    `${hex.name}.hex`,
    hex.hex,
    `Share ${hex.name}`,
    `micro:bit CreateAI project: ${hex.name}`
  );
};

/**
 * Returns true if the error represents the user dismissing the share sheet.
 *
 * Both iOS and Android Capacitor Share plugins reject with "Share canceled"
 * when the user dismisses without completing. There is no error code — the
 * message string is the only signal.
 */
export const isShareCanceled = (e: unknown): boolean =>
  e instanceof Error && e.message === "Share canceled";

/**
 * Delete all previously shared files. By the time the user initiates a new
 * share the previous share is complete and the receiving app has copied the
 * file, so it is safe to remove everything.
 */
const cleanOldFiles = async () => {
  try {
    await Filesystem.rmdir({
      path: shareFromDirectory,
      directory: tempStorageLocation,
      recursive: true,
    });
  } catch {
    // Directory may not exist yet on first share.
  }
};
