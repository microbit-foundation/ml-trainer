import { Button, Image, Text, VStack } from "@chakra-ui/react";
import { FormattedMessage } from "react-intl";
import connectCableImage from "../images/connect-cable.gif";
import ConnectContainerDialog, {
  ConnectContainerDialogProps,
} from "./ConnectContainerDialog";
import { ConnectionFlowType } from "../connection-stage-hooks";
import { stage } from "../environment";

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
    case ConnectionFlowType.DownloadProject:
      return {
        headingId: "connectMB.connectCable.heading",
        subtitleId: "connectMB.connectCable.subtitle",
      };
    case ConnectionFlowType.ConnectBluetooth:
      return {
        headingId: "connectMB.connectCable.heading",
        subtitleId: "connectMB.connectCable.subtitle",
        linkTextId: "connectMB.connectCable.skip",
        linkType: "skip",
      };
    case ConnectionFlowType.ConnectRadioRemote:
      return {
        headingId: "connectMB.connectCableMB1.heading",
        subtitleId: "connectMB.connectCableMB1.subtitle",
        ...(stage === "local"
          ? {
              linkTextId: "connectMB.connectCable.skip",
              linkType: "skip",
            }
          : {}),
      };
    case ConnectionFlowType.ConnectRadioBridge:
      return {
        headingId: "connectMB.connectCableMB2.heading",
        subtitleId: "connectMB.connectCableMB2.subtitle",
        ...(isWebBluetoothSupported
          ? {
              linkTextId: "connectMB.radioStart.switchBluetooth",
              linkType: "switch",
            }
          : {}),
      };
  }
};

export interface ConnectCableDialogProps
  extends Omit<ConnectContainerDialogProps, "children" | "headingId"> {
  config: Config;
  onSkip: () => void;
  onSwitch: () => void;
}

const ConnectCableDialog = ({
  config,
  onSkip,
  onSwitch,
  ...props
}: ConnectCableDialogProps) => {
  const { subtitleId, linkType, linkTextId, headingId } = config;
  return (
    <ConnectContainerDialog
      headingId={headingId}
      {...props}
      footerLeft={
        linkTextId &&
        linkType && (
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
          alt=""
          objectFit="contain"
          boxSize="241px"
        />
      </VStack>
    </ConnectContainerDialog>
  );
};

export default ConnectCableDialog;
