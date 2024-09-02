import { Input, MenuItem } from "@chakra-ui/react";
import { useCallback, useRef } from "react";
import { RiUpload2Line } from "react-icons/ri";
import { FormattedMessage } from "react-intl";
import { GestureData, useGestureActions } from "../gestures-hooks";
import { readFileAsText } from "../utils/fs-util";

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
