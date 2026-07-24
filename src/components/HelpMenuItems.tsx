/**
 * (c) 2024, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { Capacitor } from "@capacitor/core";
import { useCallback } from "react";
import { MdOutlineCookie } from "react-icons/md";
import {
  RiExternalLinkLine,
  RiFeedbackLine,
  RiFlag2Line,
  RiInformationLine,
} from "react-icons/ri";
import { FormattedMessage, useIntl } from "react-intl";
import { useDataConnected } from "../data-connection-flow";
import { useDeployment } from "../deployment";
import { TourTrigger } from "../model";
import { Icon, MenuDivider, MenuItem } from "@microbit/ui";
import { useStore } from "../store";
import { createDataSamplesPageUrl, createTestingModelPageUrl } from "../urls";
import { userGuideUrl } from "../utils/external-links";

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
  const intl = useIntl();
  return (
    <>
      <MenuItem
        href={userGuideUrl()}
        target="_blank"
        rel="noopener"
        icon={<Icon as={RiExternalLinkLine} />}
        textValue={intl.formatMessage({ id: "user-guide" })}
      >
        <FormattedMessage id="user-guide" />
      </MenuItem>
      <TourMenuItem
        onConnectFirstDialogOpen={onConnectFirstDialogOpen}
        tourTrigger={tourTrigger}
      />
      {deployment.supportLinks.main && (
        <MenuItem
          href={deployment.supportLinks.main}
          target="_blank"
          rel="noopener"
          icon={<Icon as={RiExternalLinkLine} />}
          textValue={intl.formatMessage({ id: "help-support" })}
        >
          <FormattedMessage id="help-support" />
        </MenuItem>
      )}
      {deployment.accessibilityLink && (
        <MenuItem
          href={deployment.accessibilityLink}
          target="_blank"
          rel="noopener"
          icon={<Icon as={RiExternalLinkLine} />}
          textValue={intl.formatMessage({ id: "accessibility" })}
        >
          <FormattedMessage id="accessibility" />
        </MenuItem>
      )}
      {deployment.supportLinks.main && (
        <MenuItem
          icon={<Icon as={RiFeedbackLine} />}
          onAction={onFeedbackOpen}
          textValue={intl.formatMessage({ id: "feedback" })}
        >
          <FormattedMessage id="feedback" />
        </MenuItem>
      )}
      <MenuDivider />
      {deployment.termsOfUseLink && (
        <MenuItem
          href={deployment.termsOfUseLink}
          target="_blank"
          rel="noopener"
          icon={<Icon as={RiExternalLinkLine} />}
          textValue={intl.formatMessage({ id: "terms" })}
        >
          <FormattedMessage id="terms" />
        </MenuItem>
      )}
      {deployment.privacyPolicyLink && (
        <MenuItem
          href={deployment.privacyPolicyLink}
          target="_blank"
          rel="noopener"
          icon={<Icon as={RiExternalLinkLine} />}
          textValue={intl.formatMessage({ id: "privacy" })}
        >
          <FormattedMessage id="privacy" />
        </MenuItem>
      )}
      {deployment.compliance.manageCookies && !Capacitor.isNativePlatform() && (
        <MenuItem
          onAction={deployment.compliance.manageCookies}
          icon={<Icon as={MdOutlineCookie} />}
          textValue={intl.formatMessage({ id: "cookies-action" })}
        >
          <FormattedMessage id="cookies-action" />
        </MenuItem>
      )}
      {(deployment.privacyPolicyLink ||
        deployment.compliance.manageCookies ||
        deployment.termsOfUseLink) && <MenuDivider />}
      <MenuItem
        icon={<Icon as={RiInformationLine} />}
        onAction={onAboutDialogOpen}
        textValue={intl.formatMessage({ id: "about" })}
      >
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
  const isConnected = useDataConnected();
  const intl = useIntl();
  const handleAction = useCallback(async () => {
    if (!isConnected) {
      onConnectFirstDialogOpen();
    } else {
      await tourStart(tourTrigger!, true);
    }
  }, [isConnected, onConnectFirstDialogOpen, tourStart, tourTrigger]);
  if (tourTrigger) {
    return (
      <MenuItem
        onAction={handleAction}
        icon={<Icon as={RiFlag2Line} />}
        textValue={intl.formatMessage({ id: "tour-action" })}
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
