/**
 * (c) 2024, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { Button, Image, Text, VStack } from "@chakra-ui/react";
import { FormattedMessage, useIntl } from "react-intl";
import { DataConnectionType, RadioFlowPhase } from "../data-connection-flow";
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
  flowType: DataConnectionType,
  canSwitchFlowType: boolean,
  radioFlowPhase?: RadioFlowPhase
): Config => {
  switch (flowType) {
    case DataConnectionType.NativeBluetooth:
      throw new Error("Unused");
    case DataConnectionType.WebBluetooth:
      return {
        headingId: "connect-cable-heading",
        subtitleId: "connect-cable-subtitle",
        linkTextId: "connect-cable-skip",
        linkType: "skip",
      };
    case DataConnectionType.Radio:
      // In bridge phase, show different content
      if (radioFlowPhase === "bridge") {
        return {
          headingId: "connect-radio-link-heading",
          subtitleId: "connect-radio-link-subtitle",
          ...(canSwitchFlowType
            ? {
                linkTextId: "connect-radio-start-switch-bluetooth",
                linkType: "switch",
              }
            : {}),
        };
      }
      // Remote phase (default)
      return {
        headingId: "connect-data-collection-heading",
        subtitleId: "connect-data-collection-subtitle",
        // Skip is only available in dev mode for faster testing
        ...(isLocalStage()
          ? {
              linkTextId: "connect-cable-skip",
              linkType: "skip",
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
