/**
 * (c) 2026, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { registerPlugin } from "@capacitor/core";

interface SaveToDownloadsPlugin {
  saveFile(options: {
    filename: string;
    data: string;
    mimeType: string;
  }): Promise<{ uri: string }>;
}

const SaveToDownloads =
  registerPlugin<SaveToDownloadsPlugin>("SaveToDownloads");

export const saveToDownloads = (
  filename: string,
  data: string,
  mimeType: string
): Promise<{ uri: string }> => {
  return SaveToDownloads.saveFile({ filename, data, mimeType });
};
