/**
 * (c) 2024, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { Link, Text, VStack } from "@chakra-ui/react";
import { useCallback, useState } from "react";
import { FormattedMessage } from "react-intl";
import { BluetoothPairingMethod } from "../data-connection-flow/data-connection-types";
import { AnimationProvider } from "./AnimationProvider";
import ConnectContainerDialog, {
  ConnectContainerDialogProps,
} from "./ConnectContainerDialog";
import PairingModeAnimation from "./PairingModeAnimation";
import PauseResumeButton from "./PauseResumeAnimationButton";

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

  const onSwitchPairingMethod = useCallback(() => {
    setPairingMethod(isTripleReset ? "a-b-reset" : "triple-reset");
  }, [isTripleReset]);

  return (
    <AnimationProvider key={pairingMethod} removeAnimationIfReducedMotion>
      <ConnectContainerDialog
        {...props}
        headingId="reset-to-bluetooth-mode-heading"
        footerLeft={
          <VStack alignItems="flex-start">
            <Link
              as="button"
              color="brand.600"
              onClick={
                isTripleReset ? onSwitchPairingMethod : onTroubleshooting
              }
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
            <PauseResumeButton />
          </VStack>
        }
      >
        <VStack gap={5} width="100%">
          <Text alignSelf="left" width="100%">
            <FormattedMessage id={subtitleId} />
          </Text>
          <PairingModeAnimation pairingMethod={pairingMethod} />
        </VStack>
      </ConnectContainerDialog>
    </AnimationProvider>
  );
};

export default ResetToBluetoothModeDialog;
