/**
 * (c) 2024, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import {
  Box,
  BoxProps,
  IconButton,
  Menu,
  MenuButton,
  MenuList,
  Portal,
} from "@chakra-ui/react";
import { useRef } from "react";
import { RiQuestionLine } from "react-icons/ri";
import { useIntl } from "react-intl";
import HelpMenuItems from "./HelpMenuItems";
import { TourTrigger } from "../model";

interface HelpMenuProps extends BoxProps {
  onAboutDialogOpen: () => void;
  onConnectFirstDialogOpen: () => void;
  onFeedbackOpen: () => void;
  tourTrigger: TourTrigger | undefined;
}

/**
 * A help button that triggers a drop-down menu with actions.
 */
const HelpMenu = ({
  onAboutDialogOpen,
  onConnectFirstDialogOpen,
  onFeedbackOpen,
  tourTrigger,
  ...rest
}: HelpMenuProps) => {
  const intl = useIntl();
  const menuButtonRef = useRef(null);
  const containerRef = useRef(null);
  return (
    <Box {...rest} ref={containerRef}>
      <Menu>
        <MenuButton
          as={IconButton}
          ref={menuButtonRef}
          aria-label={intl.formatMessage({ id: "help-label" })}
          size="sm"
          fontSize="2xl"
          h={12}
          w={12}
          color="white"
          icon={<RiQuestionLine size={24} />}
          variant="plain"
          isRound
          _focusVisible={{
            boxShadow: "outlineDark",
          }}
        />
        <Portal containerRef={containerRef}>
          <MenuList>
            <HelpMenuItems
              onAboutDialogOpen={onAboutDialogOpen}
              onConnectFirstDialogOpen={onConnectFirstDialogOpen}
              onFeedbackOpen={onFeedbackOpen}
              tourTrigger={tourTrigger}
            />
          </MenuList>
        </Portal>
      </Menu>
    </Box>
  );
};

export default HelpMenu;
