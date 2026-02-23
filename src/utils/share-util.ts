/**
 * (c) 2026, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { Encoding, Directory, Filesystem } from "@capacitor/filesystem";
import { Share } from "@capacitor/share";
import { HexData } from "../model";

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

  await Share.share({
    title,
    text,
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

const cleanOldFiles = async () => {
  let files;
  try {
    // avoid buildup of shared files
    const readdirResult = await Filesystem.readdir({
      path: shareFromDirectory,
      directory: tempStorageLocation,
    });
    files = readdirResult.files;
  } catch {
    // if the directory does not exist, don't clean it
    return;
  }

  // Don't let files older than 5m build up
  const deletionCutoff = Date.now() - 1000 * 60 * 5;

  for (const file of files) {
    if (file.mtime < deletionCutoff) {
      await Filesystem.deleteFile({
        path: `${shareFromDirectory}/${file.name}`,
        directory: tempStorageLocation,
      });
    }
  }
};
