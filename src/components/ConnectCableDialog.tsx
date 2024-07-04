import { Image, Text, VStack } from "@chakra-ui/react";
import { FormattedMessage } from "react-intl";
import connectCableImage from "../images/connect-cable.gif";
import ConnectContainerDialog, {
  ConnectContainerDialogProps,
} from "./ConnectContainerDialog";
import { ConnType } from "../connection-flow";

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

const configs: Record<ConnType, Config> = {
  [ConnType.Bluetooth]: {
    headingId: "connectMB.connectCable.heading",
    subtitleId: "connectMB.connectCable.subtitle",
    linkTextId: "connectMB.connectCable.skip",
    onLink: LinkType.Skip,
  },
  [ConnType.RadioRemote]: {
    headingId: "connectMB.connectCableMB1.heading",
    subtitleId: "connectMB.connectCableMB1.subtitle",
    onLink: LinkType.None,
  },
  [ConnType.RadioBridge]: {
    headingId: "connectMB.connectCableMB2.heading",
    subtitleId: "connectMB.connectCableMB2.subtitle",
    linkTextId: "connectMB.radioStart.switchBluetooth",
    onLink: LinkType.Switch,
  },
};

export interface ConnectCableDialogProps
  extends Omit<ConnectContainerDialogProps, "children" | "headingId"> {
  type: ConnType;
  onSkip: () => void;
  onSwitch: () => void;
}

const ConnectCableDialog = ({
  type,
  onSkip,
  onSwitch,
  ...props
}: ConnectCableDialogProps) => {
  const { subtitleId, onLink, ...typeProps } = configs[type];
  const linkConfig = {
    [LinkType.None]: undefined,
    [LinkType.Skip]: onSkip,
    [LinkType.Switch]: onSwitch,
  };
  return (
    <ConnectContainerDialog
      {...typeProps}
      {...props}
      onLinkClick={linkConfig[onLink]}
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
