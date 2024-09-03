import {
  IconButton,
  Menu,
  MenuButton,
  MenuDivider,
  MenuList,
  ThemeTypings,
} from "@chakra-ui/react";
import { useRef } from "react";
import { RiSettings2Line } from "react-icons/ri";
import { useIntl } from "react-intl";
import LanguageMenuItem from "./LanguageMenuItem";
import SaveProjectMenuItem from "./SaveProjectMenuItem";

interface SettingsMenuProps {
  variant?: ThemeTypings["components"]["Menu"]["variants"];
}

/**
 * A settings button that triggers a drop-down menu with actions.
 */
const SettingsMenu = ({ variant = "plain", ...rest }: SettingsMenuProps) => {
  const intl = useIntl();
  const settingsMenuRef = useRef(null);

  return (
    <>
      <Menu {...rest}>
        <MenuButton
          ref={settingsMenuRef}
          as={IconButton}
          aria-label={intl.formatMessage({ id: "settings-menu-action" })}
          size={variant === "plain" ? "lg" : "sm"}
          fontSize={variant === "plain" ? "2xl" : "xl"}
          icon={
            <RiSettings2Line
              fill={variant === "plain" ? "white" : "black"}
              size={variant === "plain" ? 24 : 18}
            />
          }
          variant={variant}
          isRound
          h={12}
          w={12}
          _focusVisible={{
            boxShadow: variant === "secondary" ? "outline" : "outlineDark",
          }}
        />
        <MenuList zIndex={2}>
          <SaveProjectMenuItem />
          <MenuDivider />
          <LanguageMenuItem finalFocusRef={settingsMenuRef} />
        </MenuList>
      </Menu>
    </>
  );
};

export default SettingsMenu;
