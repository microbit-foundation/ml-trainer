/**
 * (c) 2024, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { MenuDivider, MenuItem } from "@chakra-ui/react";
import { MdOutlineCookie } from "react-icons/md";
import {
  RiExternalLinkLine,
  RiFeedbackLine,
  RiFlag2Line,
  RiInformationLine,
} from "react-icons/ri";
import { FormattedMessage } from "react-intl";
import { useConnectionStage } from "../connection-stage-hooks";
import { useDeployment } from "../deployment";
import { flags } from "../flags";
import { TourTrigger } from "../model";
import { useStore } from "../store";
import { userGuideUrl } from "../utils/external-links";
import { createDataSamplesPageUrl, createTestingModelPageUrl } from "../urls";
import { Capacitor } from "@capacitor/core";

interface HelpMenuItemsProps {
  onAboutDialogOpen: () => void;
  onConnectFirstDialogOpen: () => void;
  onFeedbackOpen: () => void;
  tourTrigger: TourTrigger | undefined;
}
const HelpMenuItems = ({
  onAboutDialogOpen,
  onConnectFirstDialogOpen,
  onFeedbackOpen,
  tourTrigger,
}: HelpMenuItemsProps) => {
  const deployment = useDeployment();
  return (
    <>
      {flags.websiteContent && (
        <MenuItem
          as="a"
          href={userGuideUrl()}
          target="_blank"
          rel="noopener"
          icon={<RiExternalLinkLine />}
        >
          <FormattedMessage id="user-guide" />
        </MenuItem>
      )}
      <TourMenuItem
        onConnectFirstDialogOpen={onConnectFirstDialogOpen}
        tourTrigger={tourTrigger}
      />
      {deployment.supportLinks.main && (
        <MenuItem
          as="a"
          href={deployment.supportLinks.main}
          target="_blank"
          rel="noopener"
          icon={<RiExternalLinkLine />}
        >
          <FormattedMessage id="help-support" />
        </MenuItem>
      )}
      {deployment.accessibilityLink && (
        <MenuItem
          as="a"
          href={deployment.accessibilityLink}
          target="_blank"
          rel="noopener"
          icon={<RiExternalLinkLine />}
        >
          <FormattedMessage id="accessibility" />
        </MenuItem>
      )}
      {deployment.supportLinks.main && (
        <MenuItem icon={<RiFeedbackLine />} onClick={onFeedbackOpen}>
          <FormattedMessage id="feedback" />
        </MenuItem>
      )}
      <MenuDivider />
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
      {deployment.compliance.manageCookies && !Capacitor.isNativePlatform() && (
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
      <MenuItem icon={<RiInformationLine />} onClick={onAboutDialogOpen}>
        <FormattedMessage id="about" />
      </MenuItem>
    </>
  );
};

interface TourMenuItemProps {
  onConnectFirstDialogOpen: () => void;
  tourTrigger: TourTrigger | undefined;
}

const TourMenuItem = ({
  onConnectFirstDialogOpen,
  tourTrigger,
}: TourMenuItemProps) => {
  const tourStart = useStore((s) => s.tourStart);
  const { isConnected } = useConnectionStage();
  if (tourTrigger) {
    return (
      <MenuItem
        onClick={() => {
          if (!isConnected) {
            onConnectFirstDialogOpen();
          } else {
            tourStart(tourTrigger, true);
          }
        }}
        icon={<RiFlag2Line />}
      >
        <FormattedMessage id="tour-action" />
      </MenuItem>
    );
  }
  return null;
};

export const tourMap = {
  [createDataSamplesPageUrl()]: "Connect" as const,
  [createTestingModelPageUrl()]: "TrainModel" as const,
  // No UI to retrigger MakeCode tour
};

export default HelpMenuItems;
