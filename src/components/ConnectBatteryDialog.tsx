/**
 * (c) 2024, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { Image, Text, VStack } from "../shared-ui";
import ExternalLink from "./ExternalLink";
import { FormattedMessage } from "react-intl";
import { useDeployment } from "../deployment";
import microbitConnectedImage from "../images/stylised-microbit-connected.svg";
import ConnectContainerDialog, {
  ConnectContainerDialogProps,
} from "./ConnectContainerDialog";

export interface ConnectBatteryDialogProps
  extends Omit<ConnectContainerDialogProps, "children" | "headingId"> {}

const ConnectBatteryDialog = ({ ...props }: ConnectBatteryDialogProps) => {
  const { supportLinks } = useDeployment();
  return (
    <ConnectContainerDialog headingId="connect-battery-heading" {...props}>
      <VStack gap={5} width="100%">
        <Text alignSelf="left" width="100%">
          <FormattedMessage id="connect-battery-subtitle" />
          <ExternalLink
            textId="connect-battery-link"
            href={supportLinks.wearable}
          />
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
