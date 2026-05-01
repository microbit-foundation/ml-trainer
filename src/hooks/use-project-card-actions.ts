/**
 * (c) 2024, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { RefObject, useCallback, useRef, useState } from "react";
import { useLogging } from "../logging/logging-hooks";
import { ProjectNameDialogReason } from "../project-utils";
import { useStore } from "../store";

export type ProjectActionSurface = "home" | "projects";

interface UseProjectCardActionsOptions {
  surface: ProjectActionSurface;
  getSelectedProjectId?: () => string | undefined;
  getSelectedProjectIds?: () => string[];
  onDeleteSelected?: () => Promise<void>;
}

export const useProjectCardActions = (
  options: UseProjectCardActionsOptions
) => {
  const allProjectData = useStore((s) => s.allProjectData);
  const renameProject = useStore((s) => s.setProjectName);
  const duplicateProject = useStore((s) => s.duplicateProject);
  const deleteProject = useStore((s) => s.deleteProject);
  const logging = useLogging();
  const { surface } = options;

  const optionsRef = useRef<UseProjectCardActionsOptions>(options);
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
        logging.event({
          type: "project_delete",
          detail: { surface, count: 1 },
        });
        return deleteProject(id);
      }
      handleCloseConfirmDialog();
      if (projectForAction) {
        logging.event({
          type: "project_delete",
          detail: { surface, count: 1 },
        });
        await deleteProject(projectForAction);
      } else if (optionsRef.current.onDeleteSelected) {
        const count = optionsRef.current.getSelectedProjectIds?.().length ?? 1;
        logging.event({
          type: "project_delete",
          detail: { surface, count },
        });
        await optionsRef.current.onDeleteSelected();
      }
    },
    [
      deleteProject,
      handleCloseConfirmDialog,
      logging,
      projectForAction,
      surface,
    ]
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
    setProjectName("");
    setProjectForAction(null);
  }, []);

  const clearFinalFocusRef = useCallback(() => {
    setFinalFocusRef(undefined);
  }, []);

  const handleNameProjectSave = useCallback(
    async (name: string) => {
      if (projectForAction) {
        if (projectNameReason === "rename") {
          logging.event({
            type: "project_rename",
            detail: { surface },
          });
          await renameProject(name, projectForAction);
        } else {
          logging.event({
            type: "project_duplicate",
            detail: { surface },
          });
          await duplicateProject(projectForAction, name);
        }
      }
      handleNameProjectDialogClose();
    },
    [
      duplicateProject,
      handleNameProjectDialogClose,
      logging,
      projectForAction,
      projectNameReason,
      renameProject,
      surface,
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
