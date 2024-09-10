import { Button, useDisclosure } from "@chakra-ui/react";
import { useCallback, useEffect } from "react";
import { RiDownload2Line } from "react-icons/ri";
import { FormattedMessage } from "react-intl";
import { useProject } from "../user-projects-hooks";
import SaveExplainerDialog from "./SaveExpainerDialog";
import SaveProgressDialog from "./SaveProgressDialog";
import { useSettings } from "../settings";

const SaveButton = () => {
  const { projectIOState, setProjectIOState, downloadHex } = useProject();
  const [settings] = useSettings();
  const preSaveDialogDisclosure = useDisclosure();
  const saveProgressDisclosure = useDisclosure();

  const handleSave = useCallback(async () => {
    // This state is reset in the editor's onDownload callback when the hex is actually saved.
    setProjectIOState("saving");
    preSaveDialogDisclosure.onClose();
    saveProgressDisclosure.onOpen();
    try {
      await downloadHex();
    } catch (e) {
      setProjectIOState("inactive");
    }
  }, [
    downloadHex,
    preSaveDialogDisclosure,
    saveProgressDisclosure,
    setProjectIOState,
  ]);

  const handleSaveClick = useCallback(() => {
    if (settings.showPreSaveHelp) {
      preSaveDialogDisclosure.onOpen();
    } else {
      void handleSave();
    }
  }, [handleSave, preSaveDialogDisclosure, settings.showPreSaveHelp]);

  useEffect(() => {
    if (projectIOState !== "saving") {
      saveProgressDisclosure.onClose();
    }
  }, [projectIOState, saveProgressDisclosure]);

  return (
    <>
      <SaveExplainerDialog
        isOpen={preSaveDialogDisclosure.isOpen}
        onClose={preSaveDialogDisclosure.onClose}
        onSave={handleSave}
      />
      <SaveProgressDialog isOpen={saveProgressDisclosure.isOpen} />
      <Button
        variant="toolbar"
        leftIcon={<RiDownload2Line />}
        onClick={handleSaveClick}
      >
        <FormattedMessage id="save-action" />
      </Button>
    </>
  );
};

export default SaveButton;
