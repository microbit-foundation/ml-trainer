import { Button } from "@chakra-ui/react";
import { useCallback } from "react";
import { RiDownload2Line } from "react-icons/ri";
import { FormattedMessage } from "react-intl";
import { useProject } from "../hooks/project-hooks";
import { SaveStep } from "../model";
import { useSettings, useStore } from "../store";

const SaveButton = () => {
  const setSave = useStore((s) => s.setSave);
  const { saveHex } = useProject();
  const [settings] = useSettings();

  const handleSave = useCallback(() => {
    if (settings.showPreSaveHelp) {
      setSave({ step: SaveStep.PreSaveHelp });
    } else {
      void saveHex();
    }
  }, [saveHex, setSave, settings.showPreSaveHelp]);
  return (
    <Button
      variant="toolbar"
      leftIcon={<RiDownload2Line />}
      onClick={handleSave}
    >
      <FormattedMessage id="save-action" />
    </Button>
  );
};

export default SaveButton;
