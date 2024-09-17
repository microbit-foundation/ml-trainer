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

export const triggerBrowserDownload = (save: { name: string; hex: string }) => {
  debugger;
  const blob = new Blob([save.hex], { type: "application/octet-stream" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `${save.name}.hex`;
  a.click();
  URL.revokeObjectURL(a.href);
};
