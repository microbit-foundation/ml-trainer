/**
 * (c) 2024, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { RiSettings2Line } from "react-icons/ri";
import { useIntl } from "react-intl";
import { IconButton, MenuList, MenuTrigger } from "../shared-ui";
import { actionBarMenuButtonCss } from "./ActionBar/action-bar-menu-button";
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
      <IconButton
        variant="plain"
        isRound
        aria-label={intl.formatMessage({ id: "settings-menu-action" })}
        css={actionBarMenuButtonCss()}
      >
        <RiSettings2Line size={24} />
      </IconButton>
      <MenuList>
        <LanguageMenuItem onOpen={onLanguageDialogOpen} />
        <SettingsMenuItem onOpen={onSettingsDialogOpen} />
      </MenuList>
    </MenuTrigger>
  );
};

export default SettingsMenu;
