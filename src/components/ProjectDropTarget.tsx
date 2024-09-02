/**
 * (c) 2021, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { BoxProps } from "@chakra-ui/layout";
import { useCallback } from "react";
import FileDropTarget from "./FileDropTarget";
import { useProject } from "../user-projects-hooks";

interface ProjectDropTargetProps extends BoxProps {
  children: React.ReactElement;
}

const ProjectDropTarget = ({ children }: ProjectDropTargetProps) => {
  const { loadProject } = useProject();
  const handleDrop = useCallback(
    (files: File[]) => {
      loadProject(files);
    },
    [loadProject]
  );
  return <FileDropTarget onFileDrop={handleDrop}>{children}</FileDropTarget>;
};

export default ProjectDropTarget;
