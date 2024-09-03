import { MenuItem, useDisclosure } from "@chakra-ui/react";
import { useCallback, useEffect } from "react";
import { RiDownload2Line } from "react-icons/ri";
import { FormattedMessage } from "react-intl";
import SaveHexDialog from "./SaveHexDialog";
import { useProject } from "../user-projects-hooks";

const SaveProjectMenuItem = () => {
  const { editorEventTrigger, projectIOState, setProjectIOState } =
    useProject();
  const saveHexDisclosure = useDisclosure();
  const handleDownloadHex = useCallback(() => {
    saveHexDisclosure.onOpen();
    setProjectIOState("downloading");
    editorEventTrigger?.next({
      action: "compile",
    });
  }, [editorEventTrigger, saveHexDisclosure, setProjectIOState]);

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
      <MenuItem icon={<RiDownload2Line />} onClick={handleDownloadHex}>
        <FormattedMessage id="save-project-hex" />
      </MenuItem>
    </>
  );
};

export default SaveProjectMenuItem;
