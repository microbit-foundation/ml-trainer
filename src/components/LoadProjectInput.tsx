/**
 * (c) 2024, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { Input } from "@chakra-ui/react";
import {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { LoadAction, useProject } from "../hooks/project-hooks";

export interface LoadProjectInputProps {
  /**
   *
   * File input tag accept attribute.
   * A project can be opened from .json or .hex file.
   */
  accept: ".json" | ".hex" | ".json,.hex";
  /**
   * Set file loading state.
   */
  setLoading?: (isLoading: boolean) => void;
}

export interface LoadProjectInputRef {
  chooseFile(fileAction: LoadAction): void;
}

const LoadProjectInput = forwardRef<LoadProjectInputRef, LoadProjectInputProps>(
  function LoadProjectInput(
    { accept, setLoading }: LoadProjectInputProps,
    ref
  ) {
    const { loadFile } = useProject();
    const inputRef = useRef<HTMLInputElement>(null);
    const [action, setAction] = useState<LoadAction>("replaceProject");
    useImperativeHandle(
      ref,
      () => {
        return {
          chooseFile(fileAction) {
            setAction(fileAction);
            inputRef.current?.click();
          },
        };
      },
      []
    );

    const onOpen = useCallback(
      async (files: File[]) => {
        if (files.length === 1) {
          setLoading && setLoading(true);
          await loadFile(files[0], "file-upload", action);
          setLoading && setLoading(false);
        }
      },
      [action, loadFile, setLoading]
    );

    const handleOpenFile = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files) {
          const filesArray = Array.from(files);
          // Clear the input so we're triggered if the user opens the same file again.
          inputRef.current!.value = "";
          if (filesArray.length > 0) {
            void onOpen(filesArray);
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
