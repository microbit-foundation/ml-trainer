import { Image, Text, VStack } from "@chakra-ui/react";
import { FormattedMessage } from "react-intl";
import microbitConnectedImage from "../images/stylised-microbit-connected.svg";
import ConnectContainerDialog, {
  ConnectContainerDialogProps,
} from "./ConnectContainerDialog";

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
