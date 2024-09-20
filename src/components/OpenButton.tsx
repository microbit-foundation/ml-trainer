import { Button, Input } from "@chakra-ui/react";
import { useCallback, useRef } from "react";
import { RiFolderOpenLine } from "react-icons/ri";
import { FormattedMessage } from "react-intl";
import { useProject } from "../hooks/project-hooks";

const OpenButton = () => {
  const { loadFile } = useProject();
  const inputRef = useRef<HTMLInputElement>(null);

  const handleChooseFile = useCallback(() => {
    inputRef.current && inputRef.current.click();
  }, []);

  const onOpen = useCallback(
    (files: File[]) => {
      if (files.length === 1) {
        loadFile(files[0]);
      }
    },
    [loadFile]
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
      <Button
        variant="toolbar"
        leftIcon={<RiFolderOpenLine />}
        onClick={handleChooseFile}
      >
        <FormattedMessage id="open-file-action" />
      </Button>
      <Input
        type="file"
        display="none"
        multiple={false}
        accept=".hex"
        onChange={handleOpenFile}
        ref={inputRef}
      />
    </>
  );
};

export default OpenButton;
