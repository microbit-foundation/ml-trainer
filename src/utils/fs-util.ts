/**
 * (c) 2023, Center for Computational Thinking and Design at Aarhus University and contributors
 * Modifications (c) 2024, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { Capacitor } from "@capacitor/core";
import { HexData, HexUrl } from "../model";
import { Directory, Encoding, Filesystem } from "@capacitor/filesystem";

export const getFileExtension = (filename: string): string | undefined => {
  const parts = filename.split(".");
  return parts.length > 1 ? parts.pop() || undefined : undefined;
};

export const getLowercaseFileExtension = (
  filename: string
): string | undefined => {
  return getFileExtension(filename)?.toLowerCase();
};

/**
 * Reads file as text via a FileReader.
 *
 * @param file A file (e.g. from a file input or drop operation).
 * @returns The a promise of text from that file.
 */
export const readFileAsText = async (file: File): Promise<string> => {
  const reader = new FileReader();
  return new Promise((resolve, reject) => {
    reader.onload = (e: ProgressEvent<FileReader>) => {
      resolve(e.target!.result as string);
    };
    reader.onerror = (e: ProgressEvent<FileReader>) => {
      const error = e.target?.error || new Error("Error reading file as text");
      reject(error);
    };
    reader.readAsText(file);
  });
};

export const isHexUrl = (hex: HexData | HexUrl): hex is HexUrl => {
  return "url" in hex;
};

export const downloadDataString = async (
  data: string,
  filename: string,
  mimeType: string
) => {
  if (Capacitor.isNativePlatform()) {
    await Filesystem.writeFile({
      path: filename,
      data,
      directory: Directory.Documents,
      recursive: true,
      encoding: Encoding.UTF8,
    });
  } else {
    const blob = new Blob([data], { type: mimeType });
    const url = URL.createObjectURL(blob);
    await downloadUrl(url, filename);
    URL.revokeObjectURL(url);
  }
};

export const downloadHexData = (hex: HexData) =>
  downloadDataString(hex.hex, `${hex.name}.hex`, "application/octet-stream");

// Only used for stored Bluetooth hex files.
// Does not support data URLs on mobile devices
export const downloadUrl = async (url: string, filename: string) => {
  if (Capacitor.isNativePlatform()) {
    await Filesystem.downloadFile({
      url,
      path: filename,
      directory: Directory.Documents,
      recursive: true,
    });
  } else {
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
  }
};
