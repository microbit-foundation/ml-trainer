/**
 * (c) 2024, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { Input } from "@chakra-ui/react";
import { forwardRef, useCallback, useImperativeHandle, useRef } from "react";
import { useProject } from "../hooks/project-hooks";
import { Capacitor } from "@capacitor/core";
import { FilePicker, PickedFile } from "@capawesome/capacitor-file-picker";

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
    const { loadFile, loadNativeUrl } = useProject();
    const inputRef = useRef<HTMLInputElement>(null);
    useImperativeHandle(
      ref,
      () => {
        if (Capacitor.isNativePlatform()) {
          return {
            chooseFile() {
              const pickFiles = async () => {
                const result = await FilePicker.pickFiles({
                  types: ["application/octet-stream"],
                });

                const filesArray: PickedFile[] = Array.from(result.files);
                // Clear the input so we're triggered if the user opens the same file again.
                inputRef.current!.value = "";
                if (filesArray.length === 1) {
                  const { path, name } = filesArray[0];
                  console.log("Attempting to load", path, name);
                  if (path && name) {
                    loadNativeUrl(path, name);
                  }
                }
              };
              void pickFiles();
            },
          };
        } else {
          return {
            chooseFile() {
              inputRef.current?.click();
            },
          };
        }
      },
      [loadNativeUrl]
    );

    const onOpen = useCallback(
      (files: File[]) => {
        if (files.length === 1) {
          loadFile(files[0], "file-upload");
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
