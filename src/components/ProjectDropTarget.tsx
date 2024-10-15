/**
 * (c) 2021, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { BoxProps } from "@chakra-ui/layout";
import { useCallback } from "react";
import FileDropTarget from "./FileDropTarget";
import { useProject } from "../hooks/project-hooks";

interface ProjectDropTargetProps extends BoxProps {
  children: React.ReactElement;
  isEnabled: boolean;
}

const ProjectDropTarget = ({ children, isEnabled }: ProjectDropTargetProps) => {
  const { loadFile } = useProject();
  const handleDrop = useCallback(
    (files: File[]) => {
      if (files.length === 1) {
        loadFile(files[0]);
      }
    },
    [loadFile]
  );
  return (
    <FileDropTarget isEnabled={isEnabled} onFileDrop={handleDrop}>
      {children}
    </FileDropTarget>
  );
};

export default ProjectDropTarget;
