import { HStack, MenuDivider } from "@chakra-ui/react";
import { ReactNode, useMemo } from "react";
import { useIntl } from "react-intl";
import { useLocation } from "react-router";
import {
  keyboardShortcuts,
  useKeyboardShortcut,
} from "../../keyboard-shortcut-hooks";
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

interface ItemsRightProps {
  menuItems?: ReactNode;
  toolbarItems?: ReactNode;
}

const ItemsRight = ({ menuItems, toolbarItems }: ItemsRightProps) => {
  const intl = useIntl();
  const closeDialog = useStore((s) => s.closeDialog);
  const languageDialogOnOpen = useStore((s) => s.languageDialogOnOpen);
  const isLanguageDialogOpen = useStore((s) => s.isLanguageDialogOpen);
  const settingsDialogOnOpen = useStore((s) => s.settingsDialogOnOpen);
  const isSettingsDialogOpen = useStore((s) => s.isSettingsDialogOpen);
  const aboutDialogOnOpen = useStore((s) => s.aboutDialogOnOpen);
  const isAboutDialogOpen = useStore((s) => s.isAboutDialogOpen);
  const feedbackOnOpen = useStore((s) => s.feedbackFormOnOpen);
  const connectFirstDialogOnOpen = useStore((s) => s.connectFirstDialogOnOpen);
  const isConnectFirstDialogOpen = useStore((s) => s.isConnectFirstDialogOpen);
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
  useKeyboardShortcut(keyboardShortcuts.settings, settingsDialogOnOpen);
  return (
    <>
      <LanguageDialog isOpen={isLanguageDialogOpen} onClose={closeDialog} />
      <SettingsDialog isOpen={isSettingsDialogOpen} onClose={closeDialog} />
      <ConnectFirstDialog
        isOpen={isConnectFirstDialogOpen}
        onClose={closeDialog}
        onChooseConnect={() => setPostConnectTourTrigger(tourTrigger)}
        explanationTextId="connect-to-tour-body"
        options={{ postConnectTourTrigger: tourTrigger }}
      />
      <AboutDialog isOpen={isAboutDialogOpen} onClose={closeDialog} />
      <HStack spacing={3} display={{ base: "none", lg: "flex" }}>
        {toolbarItems}
        <SettingsMenu
          onLanguageDialogOpen={languageDialogOnOpen}
          onSettingsDialogOpen={settingsDialogOnOpen}
        />
      </HStack>
      <HelpMenu
        display={{ base: "none", md: "block", lg: "block" }}
        onAboutDialogOpen={aboutDialogOnOpen}
        onConnectFirstDialogOpen={connectFirstDialogOnOpen}
        onFeedbackOpen={feedbackOnOpen}
        tourTrigger={tourTrigger}
      />
      <ToolbarMenu
        display={{ base: "none", md: "block", lg: "none" }}
        variant="plain"
        label={intl.formatMessage({ id: "main-menu" })}
      >
        {menuItems}
        <LanguageMenuItem onOpen={languageDialogOnOpen} />
        <SettingsMenuItem onOpen={settingsDialogOnOpen} />
      </ToolbarMenu>
      {/* Toolbar items when sm window size. */}
      <ToolbarMenu
        display={{ base: "block", md: "none" }}
        variant="plain"
        label={intl.formatMessage({ id: "main-menu" })}
      >
        {menuItems}
        <LanguageMenuItem onOpen={languageDialogOnOpen} />
        <SettingsMenuItem onOpen={settingsDialogOnOpen} />
        <MenuDivider />
        <HelpMenuItems
          onAboutDialogOpen={aboutDialogOnOpen}
          onConnectFirstDialogOpen={connectFirstDialogOnOpen}
          onFeedbackOpen={feedbackOnOpen}
          tourTrigger={tourTrigger}
        />
      </ToolbarMenu>
    </>
  );
};

export default ItemsRight;
