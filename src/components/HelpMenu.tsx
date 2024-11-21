import {
  Box,
  BoxProps,
  IconButton,
  Menu,
  MenuButton,
  MenuList,
  Portal,
  useDisclosure,
} from "@chakra-ui/react";
import { useRef } from "react";
import { RiQuestionLine } from "react-icons/ri";
import { useIntl } from "react-intl";
import AboutDialog from "./AboutDialog";
import FeedbackForm from "./FeedbackForm";
import HelpMenuItems from "./HelpMenuItems";

interface HelpMenuProps extends BoxProps {}

/**
 * A help button that triggers a drop-down menu with actions.
 */
const HelpMenu = ({ ...rest }: HelpMenuProps) => {
  const aboutDialogDisclosure = useDisclosure();
  const feedbackDisclosure = useDisclosure();
  const intl = useIntl();
  const menuButtonRef = useRef(null);
  const containerRef = useRef(null);
  return (
    <Box {...rest} ref={containerRef}>
      <AboutDialog
        isOpen={aboutDialogDisclosure.isOpen}
        onClose={aboutDialogDisclosure.onClose}
        finalFocusRef={menuButtonRef}
      />
      <FeedbackForm
        isOpen={feedbackDisclosure.isOpen}
        onClose={feedbackDisclosure.onClose}
        finalFocusRef={menuButtonRef}
      />
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
            <HelpMenuItems />
          </MenuList>
        </Portal>
      </Menu>
    </Box>
  );
};

export default HelpMenu;
