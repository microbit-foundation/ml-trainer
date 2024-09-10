import { Button, useDisclosure } from "@chakra-ui/react";
import { useCallback, useEffect } from "react";
import { RiDownload2Line } from "react-icons/ri";
import { FormattedMessage } from "react-intl";
import { useProject } from "../user-projects-hooks";
import SaveHexDialog from "./SaveHexDialog";

const SaveButton = () => {
  const { projectIOState, setProjectIOState, downloadHex } = useProject();
  const saveHexDisclosure = useDisclosure();
  const handleDownloadHex = useCallback(async () => {
    saveHexDisclosure.onOpen();
    // This state is reset in the editor's onDownload callback when the hex is actually saved.
    setProjectIOState("downloading");
    try {
      await downloadHex();
    } catch (e) {
      setProjectIOState("inactive");
    }
  }, [downloadHex, saveHexDisclosure, setProjectIOState]);

  useEffect(() => {
    if (projectIOState !== "downloading") {
      saveHexDisclosure.onClose();
    }
  }, [projectIOState, saveHexDisclosure]);

  return (
    <>
      <SaveHexDialog
        isOpen={saveHexDisclosure.isOpen}
        onClose={saveHexDisclosure.onClose}
      />
      <Button
        variant="toolbar"
        leftIcon={<RiDownload2Line />}
        onClick={handleDownloadHex}
      >
        <FormattedMessage id="save-action" />
      </Button>
    </>
  );
};

export default SaveButton;
