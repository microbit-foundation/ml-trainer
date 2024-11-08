import { Icon, MenuItem, useDisclosure } from "@chakra-ui/react";
import { FormattedMessage } from "react-intl";
import { RiListSettingsLine } from "react-icons/ri";
import { SettingsDialog } from "./SettingsDialog";

interface SettingsMenuItemProps {
  finalFocusRef?: React.RefObject<HTMLButtonElement>;
}

const SettingsMenuItem = ({ finalFocusRef }: SettingsMenuItemProps) => {
  const { isOpen, onClose, onOpen } = useDisclosure();

  return (
    <>
      <SettingsDialog
        isOpen={isOpen}
        onClose={onClose}
        finalFocusRef={finalFocusRef}
      />
      <MenuItem
        icon={<Icon h={5} w={5} as={RiListSettingsLine} />}
        onClick={onOpen}
      >
        <FormattedMessage id="settings" />
      </MenuItem>
    </>
  );
};

export default SettingsMenuItem;
