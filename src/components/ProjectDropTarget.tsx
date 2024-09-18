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
  children: React.ReactNode;
}

const ProjectDropTarget = ({ children }: ProjectDropTargetProps) => {
  const { loadProject } = useProject();
  const handleDrop = useCallback(
    (files: File[]) => {
      if (files.length === 1) {
        loadProject(files[0]);
      }
    },
    [loadProject]
  );
  return <FileDropTarget onFileDrop={handleDrop}>{children}</FileDropTarget>;
};

export default ProjectDropTarget;
