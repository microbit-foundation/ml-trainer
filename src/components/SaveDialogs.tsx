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
import { SaveStep, SaveType } from "../model";
import { NameProjectDialog } from "./NameProjectDialog";
import { FormattedMessage } from "react-intl";

const SaveDialogs = () => {
  const setSave = useStore((s) => s.setSave);
  const isUntitled = useProjectIsUntitled();
  const { step, hex, type } = useStore((s) => s.save);
  const setProjectName = useStore((s) => s.setProjectName);
  const { saveHex } = useProject();

  const handleHelpNext = useCallback(async () => {
    if (isUntitled) {
      setSave({ type, step: SaveStep.ProjectName });
    } else {
      await saveHex(type);
    }
  }, [isUntitled, saveHex, setSave, type]);

  const handleSave = useCallback(
    async (newName?: string) => {
      if (newName) {
        await setProjectName(newName);
      }
      await saveHex(type, hex);
    },
    [hex, saveHex, setProjectName, type]
  );

  const handleClose = useCallback(() => {
    setSave({ step: SaveStep.None, type });
  }, [setSave, type]);

  switch (step) {
    case SaveStep.PreSaveHelp:
      return (
        <SaveHelpDialog isOpen onClose={handleClose} onSave={handleHelpNext} />
      );
    case SaveStep.ProjectName: {
      const confirmText =
        type === SaveType.Download ? (
          <FormattedMessage id="confirm-save-action" />
        ) : (
          <FormattedMessage id="confirm-share-action" />
        );
      return (
        <NameProjectDialog
          isOpen
          onClose={handleClose}
          onSave={handleSave}
          confirmText={confirmText}
        />
      );
    }
    case SaveStep.SaveProgress:
      return <SaveProgressDialog isOpen />;
    default:
      return null;
  }
};

export default SaveDialogs;
