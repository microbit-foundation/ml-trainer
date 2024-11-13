import {
  Box,
  IconButton,
  Menu,
  MenuButton,
  MenuList,
  Portal,
} from "@chakra-ui/react";
import { useRef } from "react";
import { RiSettings2Line } from "react-icons/ri";
import { useIntl } from "react-intl";
import LanguageMenuItem from "./LanguageMenuItem";
import SettingsMenuItem from "./SettingsMenuItem";

/**
 * A settings button that triggers a drop-down menu with actions.
 */
const SettingsMenu = () => {
  const intl = useIntl();
  const settingsMenuRef = useRef(null);
  const containerRef = useRef(null);
  return (
    <Box ref={containerRef}>
      <Menu>
        <MenuButton
          ref={settingsMenuRef}
          as={IconButton}
          aria-label={intl.formatMessage({ id: "settings-menu-action" })}
          size="lg"
          fontSize="2xl"
          icon={<RiSettings2Line fill="white" size={24} />}
          variant="plain"
          isRound
          h={12}
          w={12}
          _focusVisible={{
            boxShadow: "outlineDark",
          }}
        />
        <Portal containerRef={containerRef}>
          <MenuList>
            <LanguageMenuItem finalFocusRef={settingsMenuRef} />
            <SettingsMenuItem finalFocusRef={settingsMenuRef} />
          </MenuList>
        </Portal>
      </Menu>
    </Box>
  );
};

export default SettingsMenu;
