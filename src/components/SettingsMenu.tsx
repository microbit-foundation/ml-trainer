/**
 * (c) 2024, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { RiSettings2Line } from "react-icons/ri";
import { useIntl } from "react-intl";
import { Button, MenuList, MenuTrigger } from "../shared-ui";
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
      <Button
        variant="plain"
        aria-label={intl.formatMessage({ id: "settings-menu-action" })}
        css={{
          borderRadius: "full",
          color: "white",
          h: 12,
          w: 12,
          minW: 12,
          // Square icon button: the recipe's default md size adds px:4, which
          // would squeeze the icon horizontally within the fixed-width button.
          px: 0,
          _focusVisible: { boxShadow: "outlineDark" },
        }}
      >
        <RiSettings2Line size={24} />
      </Button>
      <MenuList>
        <LanguageMenuItem onOpen={onLanguageDialogOpen} />
        <SettingsMenuItem onOpen={onSettingsDialogOpen} />
      </MenuList>
    </MenuTrigger>
  );
};

export default SettingsMenu;
