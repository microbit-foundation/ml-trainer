import { HStack, MenuDivider, useDisclosure } from "@chakra-ui/react";
import { ReactNode, useMemo } from "react";
import { useIntl } from "react-intl";
import { useLocation } from "react-router";
import { useStore } from "../../store";
import AboutDialog from "../AboutDialog";
import ConnectFirstDialog from "../ConnectFirstDialog";
import FeedbackForm from "../FeedbackForm";
import HelpMenu from "../HelpMenu";
import HelpMenuItems, { tourMap } from "../HelpMenuItems";
import { LanguageDialog } from "../LanguageDialog";
import LanguageMenuItem from "../LanguageMenuItem";
import { SettingsDialog } from "../SettingsDialog";
import SettingsMenu from "../SettingsMenu";
import SettingsMenuItem from "../SettingsMenuItem";
import ToolbarMenu from "../ToolbarMenu";
import { useHotkeys } from "react-hotkeys-hook";
import {
  globalShortcutConfig,
  keyboardShortcuts,
} from "../../keyboard-shortcuts";

interface ItemsRightProps {
  menuItems?: ReactNode;
  toolbarItems?: ReactNode;
}

const ItemsRight = ({ menuItems, toolbarItems }: ItemsRightProps) => {
  const intl = useIntl();
  const languageDisclosure = useDisclosure();
  const settingsDisclosure = useDisclosure();
  const aboutDialogDisclosure = useDisclosure();
  const feedbackDisclosure = useDisclosure();
  const connectFirstDisclosure = useDisclosure();
  const setPostConnectTourTrigger = useStore(
    (s) => s.setPostConnectTourTrigger
  );
  const tourTriggerName = tourMap[useLocation().pathname];
  const tourTrigger = useMemo(() => {
    switch (tourTriggerName) {
      case "TrainModel": {
        return {
          name: tourTriggerName,
          delayedUntilConnection: true,
        };
      }
      case "Connect": {
        return { name: tourTriggerName };
      }
      default: {
        return undefined;
      }
    }
  }, [tourTriggerName]);
  useHotkeys(
    keyboardShortcuts.settings,
    settingsDisclosure.onOpen,
    globalShortcutConfig
  );
  return (
    <>
      <LanguageDialog
        isOpen={languageDisclosure.isOpen}
        onClose={languageDisclosure.onClose}
      />
      <SettingsDialog
        isOpen={settingsDisclosure.isOpen}
        onClose={settingsDisclosure.onClose}
      />
      <ConnectFirstDialog
        isOpen={connectFirstDisclosure.isOpen}
        onClose={connectFirstDisclosure.onClose}
        onChooseConnect={() => setPostConnectTourTrigger(tourTrigger)}
        explanationTextId="connect-to-tour-body"
        options={{ postConnectTourTrigger: tourTrigger }}
      />
      <AboutDialog
        isOpen={aboutDialogDisclosure.isOpen}
        onClose={aboutDialogDisclosure.onClose}
      />
      <FeedbackForm
        isOpen={feedbackDisclosure.isOpen}
        onClose={feedbackDisclosure.onClose}
      />
      <HStack spacing={3} display={{ base: "none", lg: "flex" }}>
        {toolbarItems}
        <SettingsMenu
          onLanguageDialogOpen={languageDisclosure.onOpen}
          onSettingsDialogOpen={settingsDisclosure.onOpen}
        />
      </HStack>
      <HelpMenu
        display={{ base: "none", md: "block", lg: "block" }}
        onAboutDialogOpen={aboutDialogDisclosure.onOpen}
        onConnectFirstDialogOpen={connectFirstDisclosure.onOpen}
        onFeedbackOpen={feedbackDisclosure.onOpen}
        tourTrigger={tourTrigger}
      />
      <ToolbarMenu
        display={{ base: "none", md: "block", lg: "none" }}
        variant="plain"
        label={intl.formatMessage({ id: "main-menu" })}
      >
        {menuItems}
        <LanguageMenuItem onOpen={languageDisclosure.onOpen} />
        <SettingsMenuItem onOpen={settingsDisclosure.onOpen} />
      </ToolbarMenu>
      {/* Toolbar items when sm window size. */}
      <ToolbarMenu
        display={{ base: "block", md: "none" }}
        variant="plain"
        label={intl.formatMessage({ id: "main-menu" })}
      >
        {menuItems}
        <LanguageMenuItem onOpen={languageDisclosure.onOpen} />
        <SettingsMenuItem onOpen={settingsDisclosure.onOpen} />
        <MenuDivider />
        <HelpMenuItems
          onAboutDialogOpen={aboutDialogDisclosure.onOpen}
          onConnectFirstDialogOpen={connectFirstDisclosure.onOpen}
          onFeedbackOpen={feedbackDisclosure.onOpen}
          tourTrigger={tourTrigger}
        />
      </ToolbarMenu>
    </>
  );
};

export default ItemsRight;
