/**
 * (c) 2026, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { Image, Text, VStack } from "@chakra-ui/react";
import { FormattedMessage } from "react-intl";
import microbitWithBatteryPack from "../images/microbit-with-battery-pack.svg";
import ConnectContainerDialog, {
  ConnectContainerDialogProps,
} from "./ConnectContainerDialog";

export interface NativeBluetoothConnectBatteryDialogProps
  extends Omit<ConnectContainerDialogProps, "children" | "headingId"> {
  reconnect: boolean;
}

const NativeBluetoothConnectBatteryDialog = ({
  reconnect,
  ...props
}: NativeBluetoothConnectBatteryDialogProps) => {
  return (
    <ConnectContainerDialog
      {...props}
      headingId={
        reconnect
          ? "reconnect-failed-native-heading"
          : "connect-native-start-heading"
      }
    >
      <VStack gap={5} width="100%">
        {reconnect && (
          <Text width="100%">
            <FormattedMessage id="reconnect-failed-subtitle" />
          </Text>
        )}
        <Text width="100%">
          <FormattedMessage id="connect-native-start-battery-check" />
        </Text>
        <Image
          src={microbitWithBatteryPack}
          alt=""
          width="22rem"
          aspectRatio={250 / 148}
          my={3.5}
        />
      </VStack>
    </ConnectContainerDialog>
  );
};

export default NativeBluetoothConnectBatteryDialog;
