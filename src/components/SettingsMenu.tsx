/**
 * (c) 2024, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { RiSettings2Line } from "react-icons/ri";
import { useIntl } from "react-intl";
import { MenuList, MenuTrigger } from "@microbit/ui";
import { ActionBarMenuButton } from "./ActionBar/ActionBarMenuButton";
import LanguageMenuItem from "./LanguageMenuItem";
import SettingsMenuItem from "./SettingsMenuItem";

interface SettingsMenuProps {
  onLanguageDialogOpen: () => void;
  onSettingsDialogOpen: () => void;
}
/**
 * A settings button that triggers a drop-down menu with actions.
 */
const SettingsMenu = ({
  onLanguageDialogOpen,
  onSettingsDialogOpen,
}: SettingsMenuProps) => {
  const intl = useIntl();
  return (
    <MenuTrigger>
      <ActionBarMenuButton
        aria-label={intl.formatMessage({ id: "settings-menu-action" })}
      >
        <RiSettings2Line size={24} />
      </ActionBarMenuButton>
      <MenuList>
        <LanguageMenuItem onOpen={onLanguageDialogOpen} />
        <SettingsMenuItem onOpen={onSettingsDialogOpen} />
      </MenuList>
    </MenuTrigger>
  );
};

export default SettingsMenu;
