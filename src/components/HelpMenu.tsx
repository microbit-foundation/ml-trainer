/**
 * (c) 2024, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { RiQuestionLine } from "react-icons/ri";
import { useIntl } from "react-intl";
import { MenuList, MenuTrigger } from "@microbit/ui";
import { TourTrigger } from "../model";
import { ActionBarMenuButton } from "./ActionBar/ActionBarMenuButton";
import HelpMenuItems from "./HelpMenuItems";

interface HelpMenuProps {
  onAboutDialogOpen: () => void;
  onConnectFirstDialogOpen: () => void;
  onFeedbackOpen: () => void;
  tourTrigger: TourTrigger | undefined;
  /** Hide the trigger (used at the native tablet breakpoint). */
  hidden?: boolean;
}

/**
 * A help button that triggers a drop-down menu with actions.
 */
const HelpMenu = ({
  onAboutDialogOpen,
  onConnectFirstDialogOpen,
  onFeedbackOpen,
  tourTrigger,
  hidden,
}: HelpMenuProps) => {
  const intl = useIntl();
  return (
    <MenuTrigger>
      <ActionBarMenuButton
        aria-label={intl.formatMessage({ id: "help-label" })}
        hidden={hidden}
      >
        <RiQuestionLine size={24} />
      </ActionBarMenuButton>
      <MenuList>
        <HelpMenuItems
          onAboutDialogOpen={onAboutDialogOpen}
          onConnectFirstDialogOpen={onConnectFirstDialogOpen}
          onFeedbackOpen={onFeedbackOpen}
          tourTrigger={tourTrigger}
        />
      </MenuList>
    </MenuTrigger>
  );
};

export default HelpMenu;
