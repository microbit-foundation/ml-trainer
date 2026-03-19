/**
 * (c) 2024, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { HStack } from "@chakra-ui/react";
import { ReactNode, useMemo } from "react";
import { useLocation } from "react-router";
import { keyboardShortcuts, useShortcut } from "../../keyboard-shortcut-hooks";
import { useNativeTabletBreakpoint } from "../../native-breakpoint-hooks";
import { useStore } from "../../store";
import AboutDialog from "../AboutDialog";
import ConnectFirstDialog from "../ConnectFirstDialog";
import HelpMenu from "../HelpMenu";
import { tourMap } from "../HelpMenuItems";
import { LanguageDialog } from "../LanguageDialog";
import { SettingsDialog } from "../SettingsDialog";
import SettingsMenu from "../SettingsMenu";

interface ItemsRightProps {
  toolbarItems?: ReactNode;
}

const ItemsRight = ({ toolbarItems }: ItemsRightProps) => {
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
  useShortcut(keyboardShortcuts.settings, settingsDialogOnOpen);
  const useTabletLayout = useNativeTabletBreakpoint();
  return (
    <>
      <LanguageDialog isOpen={isLanguageDialogOpen} onClose={closeDialog} />
      <SettingsDialog isOpen={isSettingsDialogOpen} onClose={closeDialog} />
      <ConnectFirstDialog
        isOpen={isConnectFirstDialogOpen}
        onClose={closeDialog}
        onChooseConnect={() => setPostConnectTourTrigger(tourTrigger)}
        explanationTextId="connect-to-tour-body"
      />
      <AboutDialog isOpen={isAboutDialogOpen} onClose={closeDialog} />
      <HStack spacing={3} display={useTabletLayout ? "none" : "flex"}>
        {toolbarItems}
        <SettingsMenu
          onLanguageDialogOpen={languageDialogOnOpen}
          onSettingsDialogOpen={settingsDialogOnOpen}
        />
      </HStack>
      <HelpMenu
        display={useTabletLayout ? "none" : "block"}
        onAboutDialogOpen={aboutDialogOnOpen}
        onConnectFirstDialogOpen={connectFirstDialogOnOpen}
        onFeedbackOpen={feedbackOnOpen}
        tourTrigger={tourTrigger}
      />
    </>
  );
};

export default ItemsRight;
