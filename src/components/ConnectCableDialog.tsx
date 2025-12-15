/**
 * (c) 2024, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { Button, Image, Text, VStack } from "@chakra-ui/react";
import { FormattedMessage, useIntl } from "react-intl";
import { ConnectionFlowType } from "../connection-stage-hooks";
import { isLocalStage } from "../environment";
import connectCableImage from "../images/connect-cable.gif";
import ConnectContainerDialog, {
  ConnectContainerDialogProps,
} from "./ConnectContainerDialog";

type LinkType = "switch" | "skip" | "none";
interface Config {
  headingId: string;
  subtitleId: string;
  linkTextId?: string;
  linkType?: LinkType;
}

export const getConnectionCableDialogConfig = (
  flowType: ConnectionFlowType,
  isWebBluetoothSupported: boolean
): Config => {
  switch (flowType) {
    case ConnectionFlowType.ConnectNativeBluetooth:
      throw new Error("Unused");
    case ConnectionFlowType.ConnectWebBluetooth:
      return {
        headingId: "connect-cable-heading",
        subtitleId: "connect-cable-subtitle",
        linkTextId: "connect-cable-skip",
        linkType: "skip",
      };
    case ConnectionFlowType.ConnectRadioRemote:
      return {
        headingId: "connect-data-collection-heading",
        subtitleId: "connect-data-collection-subtitle",
        ...(isLocalStage()
          ? {
              linkTextId: "connect-cable-skip",
              linkType: "skip",
            }
          : {}),
      };
    case ConnectionFlowType.ConnectRadioBridge:
      return {
        headingId: "connect-radio-link-heading",
        subtitleId: "connect-radio-link-subtitle",
        ...(isWebBluetoothSupported
          ? {
              linkTextId: "connect-radio-start-switch-bluetooth",
              linkType: "switch",
            }
          : {}),
      };
  }
};

export interface ConnectCableDialogProps
  extends Omit<ConnectContainerDialogProps, "children" | "headingId"> {
  config: Config;
  onSkip?: () => void;
  onSwitch?: () => void;
}

const ConnectCableDialog = ({
  config,
  onSkip,
  onSwitch,
  ...props
}: ConnectCableDialogProps) => {
  const { subtitleId, linkType, linkTextId, headingId } = config;
  const intl = useIntl();
  return (
    <ConnectContainerDialog
      headingId={headingId}
      {...props}
      footerLeft={
        linkTextId &&
        linkType &&
        onSkip &&
        onSwitch && (
          <Button
            onClick={linkType === "skip" ? onSkip : onSwitch}
            variant="link"
            size="lg"
          >
            <FormattedMessage id={linkTextId} />
          </Button>
        )
      }
    >
      <VStack gap={5}>
        <Text width="100%">
          <FormattedMessage id={subtitleId} />
        </Text>
        <Image
          src={connectCableImage}
          alt={intl.formatMessage({ id: "connect-cable-alt" })}
          objectFit="contain"
          boxSize="241px"
        />
      </VStack>
    </ConnectContainerDialog>
  );
};

export default ConnectCableDialog;
