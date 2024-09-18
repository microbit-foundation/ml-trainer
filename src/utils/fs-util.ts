import { HexData, HexUrl } from "../model";

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

const isHexUrl = (hex: HexData | HexUrl): hex is HexUrl => {
  return "url" in hex;
};

export const downloadHex = (hex: HexData | HexUrl) => {
  if (isHexUrl(hex)) {
    downloadUrl(hex.url, `${hex.name}.hex`);
  } else {
    downloadHexData(hex);
  }
};

const downloadHexData = (hex: HexData) => {
  const blob = new Blob([hex.hex], { type: "application/octet-stream" });
  const url = URL.createObjectURL(blob);
  downloadUrl(url, `${hex.name}.hex`);
  URL.revokeObjectURL(url);
};

export const downloadUrl = (url: string, download?: string) => {
  const a = document.createElement("a");
  a.href = url;
  if (download) {
    a.download = download;
  }
  a.click();
};
