import { Input, MenuItem } from "@chakra-ui/react";
import { useCallback, useRef } from "react";
import { RiUpload2Line } from "react-icons/ri";
import { FormattedMessage } from "react-intl";
import { GestureData, useGestureActions } from "../gestures-hooks";

/**
 * Reads file as text via a FileReader.
 *
 * @param file A file (e.g. from a file input or drop operation).
 * @returns The a promise of text from that file.
 */
const readFileAsText = async (file: File): Promise<string> => {
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

const UploadDataSamplesMenuItem = () => {
  const actions = useGestureActions();
  const inputRef = useRef<HTMLInputElement>(null);

  const handleChooseFile = useCallback(() => {
    inputRef.current && inputRef.current.click();
  }, []);

  const onOpen = useCallback(
    async (files: File[]) => {
      if (files.length === 0) {
        throw new Error("Expected to be called with at least one file");
      }
      const gestureData = await readFileAsText(files[0]);
      actions.validateAndSetGestures(
        JSON.parse(gestureData) as Partial<GestureData>[]
      );
    },
    [actions]
  );

  const handleOpenFile = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files) {
        const filesArray = Array.from(files);
        // Clear the input so we're triggered if the user opens the same file again.
        inputRef.current!.value = "";
        if (filesArray.length > 0) {
          await onOpen(filesArray);
        }
      }
    },
    [onOpen]
  );

  return (
    <>
      <MenuItem icon={<RiUpload2Line />} onClick={handleChooseFile}>
        <FormattedMessage id="content.data.controlbar.button.uploadData" />
      </MenuItem>
      <Input
        type="file"
        display="none"
        multiple={false}
        accept=".json"
        onChange={handleOpenFile}
        ref={inputRef}
      />
    </>
  );
};

export default UploadDataSamplesMenuItem;
