import { Icon, MenuItem } from "@chakra-ui/react";
import { RiListSettingsLine } from "react-icons/ri";
import { FormattedMessage } from "react-intl";

interface SettingsMenuItemProps {
  onOpen: () => void;
}

const SettingsMenuItem = ({ onOpen }: SettingsMenuItemProps) => {
  return (
    <MenuItem
      icon={<Icon h={5} w={5} as={RiListSettingsLine} />}
      onClick={onOpen}
    >
      <FormattedMessage id="settings" />
    </MenuItem>
  );
};

export default SettingsMenuItem;
