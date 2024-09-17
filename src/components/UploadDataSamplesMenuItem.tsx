import { Input, MenuItem } from "@chakra-ui/react";
import { useCallback, useRef } from "react";
import { RiUpload2Line } from "react-icons/ri";
import { FormattedMessage } from "react-intl";
import { useProject } from "../hooks/project-hooks";

const UploadDataSamplesMenuItem = () => {
  const { loadProject } = useProject();
  const inputRef = useRef<HTMLInputElement>(null);

  const handleChooseFile = useCallback(() => {
    inputRef.current && inputRef.current.click();
  }, []);

  const onOpen = useCallback(
    (files: File[]) => {
      if (files.length === 1) {
        loadProject(files[0]);
      }
    },
    [loadProject]
  );

  const handleOpenFile = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files) {
        const filesArray = Array.from(files);
        // Clear the input so we're triggered if the user opens the same file again.
        inputRef.current!.value = "";
        if (filesArray.length > 0) {
          onOpen(filesArray);
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
