import { Button, Image, Text, VStack } from "@chakra-ui/react";
import { FormattedMessage } from "react-intl";
import connectCableImage from "../images/connect-cable.gif";
import ConnectContainerDialog, {
  ConnectContainerDialogProps,
} from "./ConnectContainerDialog";
import { ConnectionFlowType } from "../connection-stage-hooks";
import { stage } from "../environment";

enum LinkType {
  Switch,
  Skip,
  None,
}
interface Config {
  headingId: string;
  subtitleId: string;
  linkTextId?: string;
  onLink: LinkType;
}

const configs: Record<ConnectionFlowType, Config> = {
  [ConnectionFlowType.Bluetooth]: {
    headingId: "connectMB.connectCable.heading",
    subtitleId: "connectMB.connectCable.subtitle",
    linkTextId: "connectMB.connectCable.skip",
    onLink: LinkType.Skip,
  },
  [ConnectionFlowType.RadioRemote]: {
    headingId: "connectMB.connectCableMB1.heading",
    subtitleId: "connectMB.connectCableMB1.subtitle",
    ...(stage === "local"
      ? {
          linkTextId: "connectMB.connectCable.skip",
          onLink: LinkType.Skip,
        }
      : {
          onLink: LinkType.None,
        }),
  },
  [ConnectionFlowType.RadioBridge]: {
    headingId: "connectMB.connectCableMB2.heading",
    subtitleId: "connectMB.connectCableMB2.subtitle",
    linkTextId: "connectMB.radioStart.switchBluetooth",
    onLink: LinkType.Switch,
  },
};

export interface ConnectCableDialogProps
  extends Omit<ConnectContainerDialogProps, "children" | "headingId"> {
  type: ConnectionFlowType;
  onSkip: () => void;
  onSwitch: () => void;
}

const ConnectCableDialog = ({
  type,
  onSkip,
  onSwitch,
  ...props
}: ConnectCableDialogProps) => {
  const { subtitleId, onLink, linkTextId, headingId } = configs[type];
  const linkConfig = {
    [LinkType.None]: undefined,
    [LinkType.Skip]: onSkip,
    [LinkType.Switch]: onSwitch,
  };
  return (
    <ConnectContainerDialog
      headingId={headingId}
      {...props}
      footerLeft={
        linkTextId && (
          <Button onClick={linkConfig[onLink]} variant="link" size="lg">
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
