import { Icon, Image, Link, Text, VStack } from "@chakra-ui/react";
import { FormattedMessage } from "react-intl";
import microbitConnectedImage from "../images/stylised-microbit-connected.svg";
import ConnectContainerDialog, {
  ConnectContainerDialogProps,
} from "./ConnectContainerDialog";
import { RiExternalLinkLine } from "react-icons/ri";

export interface ConnectBatteryDialogProps
  extends Omit<ConnectContainerDialogProps, "children" | "headingId"> {}

const ConnectBatteryDialog = ({ ...props }: ConnectBatteryDialogProps) => {
  return (
    <ConnectContainerDialog
      headingId="connectMB.connectBattery.heading"
      {...props}
    >
      <VStack gap={5} width="100%">
        <Text alignSelf="left" width="100%">
          <FormattedMessage id="connectMB.connectBattery.subtitle" />
          <Link
            color="purple.500"
            //TODO: Replace with real support link.
            href="https://support.microbit.org/support/home"
            target="_blank"
            rel="noopener"
            display="flex"
            flexDirection="row"
            gap={1}
          >
            <FormattedMessage id="connectMB.connectBattery.link" />
            <Icon
              as={RiExternalLinkLine}
              boxSize={5}
              color="purple.500"
              position="relative"
            />
          </Link>
        </Text>
        <Image
          height="229px"
          width="16rem"
          src={microbitConnectedImage}
          alt=""
        />
      </VStack>
    </ConnectContainerDialog>
  );
};

export default ConnectBatteryDialog;
