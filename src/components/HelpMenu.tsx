import {
  Box,
  IconButton,
  Menu,
  MenuButton,
  MenuDivider,
  MenuItem,
  MenuList,
  Portal,
  useDisclosure,
} from "@chakra-ui/react";
import {
  RiExternalLinkLine,
  RiFeedbackLine,
  RiInformationLine,
  RiQuestionLine,
} from "react-icons/ri";
import { MdOutlineCookie } from "react-icons/md";
import AboutDialog from "./AboutDialog";
import { FormattedMessage, useIntl } from "react-intl";
import { useRef } from "react";
import { manageCookies } from "../compliance";
import FeedbackForm from "./FeedbackForm";

interface HelpMenuProps {
  isMobile?: boolean;
  appName: string;
  cookies?: boolean;
}

/**
 * A help button that triggers a drop-down menu with actions.
 */
const HelpMenu = ({ isMobile, appName, cookies, ...rest }: HelpMenuProps) => {
  const aboutDialogDisclosure = useDisclosure();
  const feedbackDisclosure = useDisclosure();
  const intl = useIntl();
  const MenuButtonRef = useRef(null);

  return (
    <>
      <FeedbackForm
        isOpen={feedbackDisclosure.isOpen}
        onClose={feedbackDisclosure.onClose}
      />
      <Box display={isMobile ? { base: "block", lg: "none" } : undefined}>
        <AboutDialog
          appName={appName}
          isOpen={aboutDialogDisclosure.isOpen}
          onClose={aboutDialogDisclosure.onClose}
          finalFocusRef={MenuButtonRef}
        />
        <Menu {...rest}>
          <MenuButton
            as={IconButton}
            ref={MenuButtonRef}
            aria-label={intl.formatMessage({ id: "help-label" })}
            size={isMobile ? "md" : "sm"}
            fontSize="2xl"
            h={12}
            w={12}
            icon={<RiQuestionLine fill="white" size={24} />}
            variant="plain"
            isRound
            _focusVisible={{
              boxShadow: "outlineDark",
            }}
          />
          <Portal>
            <MenuList>
              <MenuItem
                as="a"
                href="https://support.microbit.org"
                target="_blank"
                rel="noopener"
                icon={<RiExternalLinkLine />}
              >
                <FormattedMessage id="help-support" />
              </MenuItem>
              <MenuItem
                icon={<RiFeedbackLine />}
                onClick={feedbackDisclosure.onOpen}
              >
                <FormattedMessage id="feedback" />
              </MenuItem>
              <MenuDivider />
              <MenuItem
                as="a"
                href="https://microbit.org/terms-of-use/"
                target="_blank"
                rel="noopener"
                icon={<RiExternalLinkLine />}
              >
                <FormattedMessage id="terms" />
              </MenuItem>
              <MenuItem
                as="a"
                href="https://microbit.org/privacy/"
                target="_blank"
                rel="noopener"
                icon={<RiExternalLinkLine />}
              >
                <FormattedMessage id="privacy" />
              </MenuItem>
              {cookies && (
                <MenuItem
                  as="button"
                  onClick={manageCookies}
                  icon={<MdOutlineCookie />}
                >
                  <FormattedMessage id="cookies-action" />
                </MenuItem>
              )}
              <MenuDivider />
              <MenuItem
                icon={<RiInformationLine />}
                onClick={aboutDialogDisclosure.onOpen}
              >
                <FormattedMessage id="about" />
              </MenuItem>
            </MenuList>
          </Portal>
        </Menu>
      </Box>
    </>
  );
};

export default HelpMenu;
