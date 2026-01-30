/**
 * (c) 2024, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { AspectRatio, Image, Link, Text, VStack } from "@chakra-ui/react";
import { FormattedMessage } from "react-intl";
import { BluetoothPairingMethod } from "../data-connection-flow/data-connection-types";
import abReset from "../images/bluetooth-mode-a+b+reset.gif";
import tripleReset from "../images/bluetooth-mode-triple-reset.gif";
import ConnectContainerDialog, {
  ConnectContainerDialogProps,
} from "./ConnectContainerDialog";
import { useCallback, useState } from "react";

export interface ResetToBluetoothModeDialogProps
  extends Omit<ConnectContainerDialogProps, "children" | "headingId"> {
  onTroubleshooting: () => void;
}

const ResetToBluetoothModeDialog = ({
  onTroubleshooting,
  ...props
}: ResetToBluetoothModeDialogProps) => {
  const [pairingMethod, setPairingMethod] =
    useState<BluetoothPairingMethod>("triple-reset");
  const isTripleReset = pairingMethod === "triple-reset";
  const subtitleId = isTripleReset
    ? "reset-to-bluetooth-mode-subtitle"
    : "reset-to-bluetooth-mode-ab-subtitle";
  const image = isTripleReset ? tripleReset : abReset;

  const onSwitchPairingMethod = useCallback(() => {
    setPairingMethod(isTripleReset ? "a-b-reset" : "triple-reset");
  }, [isTripleReset]);

  return (
    <ConnectContainerDialog
      {...props}
      headingId="reset-to-bluetooth-mode-heading"
      footerLeft={
        <Link
          as="button"
          color="brand.600"
          onClick={isTripleReset ? onSwitchPairingMethod : onTroubleshooting}
          display="flex"
          flexDirection="row"
          gap={1}
        >
          {isTripleReset ? (
            <FormattedMessage id="connect-try-another-way" />
          ) : (
            <FormattedMessage id="connect-unable-to-enter-bluetooth-mode" />
          )}
        </Link>
      }
    >
      <VStack gap={5} width="100%">
        <Text alignSelf="left" width="100%">
          <FormattedMessage id={subtitleId} />
        </Text>
        <AspectRatio
          ratio={3 / 2}
          bgColor="black"
          width="22rem"
          rounded="md"
          pt={isTripleReset ? 0 : 12}
        >
          <Image src={image} alt="" mt={-2.5} px={5} />
        </AspectRatio>
      </VStack>
    </ConnectContainerDialog>
  );
};

export default ResetToBluetoothModeDialog;
