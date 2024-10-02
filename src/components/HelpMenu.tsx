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
  RiInformationLine,
  RiQuestionLine,
} from "react-icons/ri";
import { MdOutlineCookie } from "react-icons/md";
import AboutDialog from "./AboutDialog";
import { FormattedMessage, useIntl } from "react-intl";
import { useRef } from "react";
import { manageCookies } from "../compliance";
import { useDeployment } from "../deployment";

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
  const intl = useIntl();
  const MenuButtonRef = useRef(null);
  const deployment = useDeployment();

  return (
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
            {deployment.supportLink && (
              <>
                <MenuItem
                  as="a"
                  href={deployment.supportLink}
                  target="_blank"
                  rel="noopener"
                  icon={<RiExternalLinkLine />}
                >
                  <FormattedMessage id="help-support" />
                </MenuItem>
                <MenuDivider />
              </>
            )}
            {deployment.termsOfUseLink && (
              <MenuItem
                as="a"
                href={deployment.termsOfUseLink}
                target="_blank"
                rel="noopener"
                icon={<RiExternalLinkLine />}
              >
                <FormattedMessage id="terms" />
              </MenuItem>
            )}
            {deployment.privacyPolicyLink && (
              <MenuItem
                as="a"
                href="https://microbit.org/privacy/"
                target="_blank"
                rel="noopener"
                icon={<RiExternalLinkLine />}
              >
                <FormattedMessage id="privacy" />
              </MenuItem>
            )}
            {deployment.compliance.manageCookies && (
              <MenuItem
                as="button"
                onClick={deployment.compliance.manageCookies}
                icon={<MdOutlineCookie />}
              >
                <FormattedMessage id="cookies-action" />
              </MenuItem>
            )}
            {(deployment.privacyPolicyLink ||
              deployment.compliance.manageCookies ||
              deployment.termsOfUseLink) && <MenuDivider />}
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
  );
};

export default HelpMenu;
