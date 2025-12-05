/**
 * (c) 2024, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { useCallback } from "react";
import { useProjectIsUntitled, useProject } from "../hooks/project-hooks";
import { useStore } from "../store";
import SaveHelpDialog from "./SaveHelpDialog";
import SaveProgressDialog from "./SaveProgressDialog";
import { SaveStep } from "../model";
import { NameProjectDialog } from "./NameProjectDialog";

const SaveDialogs = () => {
  const setSave = useStore((s) => s.setSave);
  const isUntitled = useProjectIsUntitled();
  const { step, hex } = useStore((s) => s.save);
  const setProjectName = useStore((s) => s.setProjectName);
  const { saveHex } = useProject();

  const handleHelpNext = useCallback(async () => {
    if (isUntitled) {
      setSave({ step: SaveStep.ProjectName });
    } else {
      await saveHex();
    }
  }, [isUntitled, saveHex, setSave]);

  const handleSave = useCallback(
    async (newName?: string) => {
      if (newName) {
        await setProjectName(newName);
      }
      await saveHex(hex);
    },
    [hex, saveHex, setProjectName]
  );

  const handleClose = useCallback(() => {
    setSave({ step: SaveStep.None });
  }, [setSave]);

  switch (step) {
    case SaveStep.PreSaveHelp:
      return (
        <SaveHelpDialog isOpen onClose={handleClose} onSave={handleHelpNext} />
      );
    case SaveStep.ProjectName:
      return (
        <NameProjectDialog isOpen onClose={handleClose} onSave={handleSave} />
      );
    case SaveStep.SaveProgress:
      return <SaveProgressDialog isOpen />;
    default:
      return null;
  }
};

export default SaveDialogs;
