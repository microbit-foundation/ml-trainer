import { Button, useDisclosure, useToast } from "@chakra-ui/react";
import { useCallback } from "react";
import { RiDownload2Line } from "react-icons/ri";
import { FormattedMessage, useIntl } from "react-intl";
import { useSettings } from "../settings";
import { useProject } from "../user-projects-hooks";
import SaveHelpDialog from "./SaveHelpDialog";
import SaveProgressDialog from "./SaveProgressDialog";

const SaveButton = () => {
  const { saveProjectHex } = useProject();
  const [settings] = useSettings();
  const preSaveDialogDisclosure = useDisclosure();
  const saveProgressDisclosure = useDisclosure();
  const intl = useIntl();
  const toast = useToast();

  const handleSave = useCallback(async () => {
    preSaveDialogDisclosure.onClose();
    saveProgressDisclosure.onOpen();
    await saveProjectHex();
    saveProgressDisclosure.onClose();
    toast({
      id: "save-complete",
      position: "top",
      duration: 5_000,
      title: intl.formatMessage({ id: "saving-toast-title" }),
      status: "info",
    });
  }, [
    preSaveDialogDisclosure,
    saveProgressDisclosure,
    saveProjectHex,
    toast,
    intl,
  ]);

  const handleSaveClick = useCallback(() => {
    if (settings.showPreSaveHelp) {
      preSaveDialogDisclosure.onOpen();
    } else {
      void handleSave();
    }
  }, [handleSave, preSaveDialogDisclosure, settings.showPreSaveHelp]);

  return (
    <>
      <SaveHelpDialog
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
