import { Input, MenuItem, MenuItemProps } from "@chakra-ui/react";
import { useCallback, useRef } from "react";
import { useProject } from "../hooks/project-hooks";

interface LoadProjectMenuItemProps extends MenuItemProps {
  /**
   *
   * File input tag accept attribute.
   * A project can be opened from .json or .hex file.
   */
  accept?: ".json" | ".hex";
}

const LoadProjectMenuItem = ({
  accept,
  ...props
}: LoadProjectMenuItemProps) => {
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
      <MenuItem {...props} onClick={handleChooseFile} />
      <Input
        type="file"
        display="none"
        multiple={false}
        accept={accept}
        onChange={handleOpenFile}
        ref={inputRef}
      />
    </>
  );
};

export default LoadProjectMenuItem;
