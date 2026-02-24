/**
 * (c) 2024, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { RefObject, useCallback, useRef, useState } from "react";
import { ProjectNameDialogReason } from "../project-utils";
import { useStore } from "../store";

interface UseProjectCardActionsOptions {
  getSelectedProjectId?: () => string | undefined;
  onDeleteSelected?: () => Promise<void>;
}

export const useProjectCardActions = (
  options?: UseProjectCardActionsOptions
) => {
  const allProjectData = useStore((s) => s.allProjectData);
  const renameProject = useStore((s) => s.setProjectName);
  const duplicateProject = useStore((s) => s.duplicateProject);
  const deleteProject = useStore((s) => s.deleteProject);

  const optionsRef = useRef(options);
  optionsRef.current = options;

  const [projectForAction, setProjectForAction] = useState<string | null>(null);
  const [nameDialogIsOpen, setNameDialogIsOpen] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [projectNameReason, setProjectNameReason] =
    useState<ProjectNameDialogReason>();
  const [confirmDialogIsOpen, setConfirmDialogIsOpen] = useState(false);
  const [finalFocusRef, setFinalFocusRef] = useState<
    RefObject<HTMLElement> | undefined
  >();

  const handleCloseConfirmDialog = useCallback(() => {
    setConfirmDialogIsOpen(false);
    setProjectName("");
    setProjectForAction(null);
  }, []);

  const handleDeleteProject = useCallback(
    async (id?: string) => {
      if (id) {
        return deleteProject(id);
      }
      handleCloseConfirmDialog();
      if (projectForAction) {
        await deleteProject(projectForAction);
      } else if (optionsRef.current?.onDeleteSelected) {
        await optionsRef.current.onDeleteSelected();
      }
    },
    [deleteProject, handleCloseConfirmDialog, projectForAction]
  );

  const handleOpenNameProjectDialog = useCallback(
    (reason: ProjectNameDialogReason, id?: string) => {
      const projectId = id ?? optionsRef.current?.getSelectedProjectId?.();
      const project = allProjectData.find((p) => p.id === projectId);
      if (project) {
        setProjectNameReason(reason);
        setProjectName(project.name);
        setNameDialogIsOpen(true);
        setProjectForAction(project.id);
      }
    },
    [allProjectData]
  );

  const handleNameProjectDialogClose = useCallback(() => {
    setNameDialogIsOpen(false);
    setProjectForAction(null);
  }, []);

  const clearFinalFocusRef = useCallback(() => {
    setFinalFocusRef(undefined);
  }, []);

  const handleNameProjectSave = useCallback(
    async (name: string) => {
      if (projectForAction) {
        if (projectNameReason === "rename") {
          await renameProject(name, projectForAction);
        } else {
          await duplicateProject(projectForAction, name);
        }
      }
      handleNameProjectDialogClose();
    },
    [
      duplicateProject,
      handleNameProjectDialogClose,
      projectForAction,
      projectNameReason,
      renameProject,
    ]
  );

  const handleOpenConfirmDialog = useCallback(
    (id?: string) => {
      const projectId = id ?? optionsRef.current?.getSelectedProjectId?.();
      const project = projectId
        ? allProjectData.find((p) => p.id === projectId)
        : undefined;
      if (project) {
        setProjectName(project.name);
        setConfirmDialogIsOpen(true);
        setProjectForAction(project.id);
      } else if (!projectId) {
        // Multi-select delete: no single project, just open confirm dialog
        setConfirmDialogIsOpen(true);
      }
    },
    [allProjectData]
  );

  return {
    projectForAction,
    projectName,
    projectNameReason,
    nameDialogIsOpen,
    confirmDialogIsOpen,
    finalFocusRef,
    setFinalFocusRef,
    clearFinalFocusRef,
    handleOpenNameProjectDialog,
    handleNameProjectDialogClose,
    handleNameProjectSave,
    handleOpenConfirmDialog,
    handleCloseConfirmDialog,
    handleDeleteProject,
  };
};
