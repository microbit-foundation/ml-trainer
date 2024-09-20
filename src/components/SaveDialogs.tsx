import { useCallback } from "react";
import { useProject } from "../hooks/project-hooks";
import { useStore } from "../store";
import SaveHelpDialog from "./SaveHelpDialog";
import SaveProgressDialog from "./SaveProgressDialog";
import { SaveStep } from "../model";

const SaveDialogs = () => {
  const setSave = useStore((s) => s.setSave);
  const { step, hex } = useStore((s) => s.save);
  const { saveHex } = useProject();

  const handleSave = useCallback(async () => {
    await saveHex(hex);
  }, [hex, saveHex]);

  const handleClose = useCallback(() => {
    setSave({ step: SaveStep.None });
  }, [setSave]);

  switch (step) {
    case SaveStep.PreSaveHelp:
      return (
        <SaveHelpDialog isOpen onClose={handleClose} onSave={handleSave} />
      );
    case SaveStep.SaveProgress:
      return <SaveProgressDialog isOpen />;
    default:
      return null;
  }
};

export default SaveDialogs;
