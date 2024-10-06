import { Input } from "@chakra-ui/react";
import { forwardRef, useCallback, useImperativeHandle, useRef } from "react";
import { useProject } from "../hooks/project-hooks";

export interface LoadProjectInputProps {
  /**
   *
   * File input tag accept attribute.
   * A project can be opened from .json or .hex file.
   */
  accept: ".json" | ".hex" | ".json,.hex";
}

export interface LoadProjectInputRef {
  chooseFile(): void;
}

const LoadProjectInput = forwardRef<LoadProjectInputRef, LoadProjectInputProps>(
  function LoadProjectInput({ accept }: LoadProjectInputProps, ref) {
    const { loadFile } = useProject();
    const inputRef = useRef<HTMLInputElement>(null);
    useImperativeHandle(
      ref,
      () => {
        return {
          chooseFile() {
            inputRef.current?.click();
          },
        };
      },
      []
    );

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
      <Input
        type="file"
        display="none"
        multiple={false}
        accept={accept}
        onChange={handleOpenFile}
        ref={inputRef}
      />
    );
  }
);

export default LoadProjectInput;
