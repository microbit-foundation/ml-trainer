import { MenuDivider, MenuItem, useDisclosure } from "@chakra-ui/react";
import { useRef } from "react";
import { MdOutlineCookie } from "react-icons/md";
import {
  RiExternalLinkLine,
  RiFeedbackLine,
  RiFlag2Line,
  RiInformationLine,
} from "react-icons/ri";
import { FormattedMessage } from "react-intl";
import { useLocation } from "react-router";
import { useConnectionStage } from "../connection-stage-hooks";
import { useDeployment } from "../deployment";
import { TourId } from "../model";
import { useStore } from "../store";
import { createDataSamplesPageUrl, createTestingModelPageUrl } from "../urls";
import { userGuideUrl } from "../utils/external-links";
import AboutDialog from "./AboutDialog";
import ConnectFirstDialog from "./ConnectFirstDialog";
import FeedbackForm from "./FeedbackForm";

const HelpMenuItems = () => {
  const aboutDialogDisclosure = useDisclosure();
  const feedbackDisclosure = useDisclosure();
  const MenuButtonRef = useRef(null);
  const deployment = useDeployment();
  return (
    <>
      <AboutDialog
        isOpen={aboutDialogDisclosure.isOpen}
        onClose={aboutDialogDisclosure.onClose}
        finalFocusRef={MenuButtonRef}
      />
      <FeedbackForm
        isOpen={feedbackDisclosure.isOpen}
        onClose={feedbackDisclosure.onClose}
        finalFocusRef={MenuButtonRef}
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
      <TourMenuItem />
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

const tourMap = {
  [createDataSamplesPageUrl()]: TourId.DataSamplesPage,
  [createTestingModelPageUrl()]: TourId.TestModelPage,
  // No UI to retrigger MakeCode tour
};

const TourMenuItem = () => {
  const tourId = tourMap[useLocation().pathname];
  const setPostConnectTourId = useStore((s) => s.setPostConnectTourId);
  const tourStart = useStore((s) => s.tourStart);
  const disclosure = useDisclosure();
  const { isConnected } = useConnectionStage();
  return (
    tourId && (
      <>
        <ConnectFirstDialog
          isOpen={disclosure.isOpen}
          onClose={disclosure.onClose}
          onChooseConnect={() => setPostConnectTourId(tourId)}
          explanationTextId="connect-to-tour-body"
          options={{ postConnectTourId: tourId }}
        />
        <MenuItem
          onClick={() => {
            if (!isConnected) {
              disclosure.onOpen();
            } else {
              tourStart(tourId, true);
            }
          }}
          icon={<RiFlag2Line />}
        >
          <FormattedMessage id="tour-action" />
        </MenuItem>
      </>
    )
  );
};

export default HelpMenuItems;
