import { MenuDivider, MenuItem, useDisclosure } from "@chakra-ui/react";
import { useRef } from "react";
import { MdOutlineCookie } from "react-icons/md";
import {
  RiExternalLinkLine,
  RiFeedbackLine,
  RiInformationLine,
} from "react-icons/ri";
import { FormattedMessage } from "react-intl";
import { useDeployment } from "../deployment";
import AboutDialog from "./AboutDialog";
import FeedbackForm from "./FeedbackForm";
import { userGuideUrl } from "../utils/external-links";

const HelpMenuItems = () => {
  const aboutDialogDisclosure = useDisclosure();
  const feedbackDisclosure = useDisclosure();
  const menuButtonRef = useRef(null);
  const deployment = useDeployment();
  return (
    <>
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
      <MenuItem
        as="a"
        href={userGuideUrl()}
        target="_blank"
        rel="noopener"
        icon={<RiExternalLinkLine />}
      >
        <FormattedMessage id="user-guide" />
      </MenuItem>
      {deployment.supportLinks.main && (
        <>
          <MenuItem
            as="a"
            href={deployment.supportLinks.main}
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
          href={deployment.privacyPolicyLink}
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
    </>
  );
};

export default HelpMenuItems;
