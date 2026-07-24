/**
 * (c) 2024, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { HStack, Image, Text, VStack } from "@microbit/ui";
import { FormattedMessage, useIntl } from "react-intl";
import microbitWithComputer from "../images/stylised-microbit-with-usb-computer.svg";
import { AnimationProvider } from "./AnimationProvider";
import ConnectContainerDialog, {
  ConnectContainerDialogProps,
} from "./ConnectContainerDialog";
import PlugMicrobitAnimation from "./PlugMicrobitAnimation";

export interface ConnectCableDialogProps
  extends Omit<ConnectContainerDialogProps, "children" | "headingId"> {}

const UnplugRadioLinkMicrobitDialog = ({
  ...props
}: ConnectCableDialogProps) => {
  const intl = useIntl();
  return (
    <ConnectContainerDialog
      headingId="unplug-radio-link-microbit-title"
      {...props}
    >
      <VStack gap={5}>
        <Text width="100%">
          <FormattedMessage id="unplug-radio-link-microbit-description" />
        </Text>
        <HStack gap={10}>
          <VStack gap={5} pt={30}>
            <Image
              src={microbitWithComputer}
              alt={intl.formatMessage({
                id: "radio-link-microbit-label",
              })}
            />
            <Text fontWeight="bold">
              <FormattedMessage id="radio-link-microbit" />
            </Text>
          </VStack>
          <AnimationProvider removeAnimationIfReducedMotion>
            <PlugMicrobitAnimation
              width="200px"
              unplug
              alt={intl.formatMessage({
                id: "unplug-radio-link-microbit-label",
              })}
            />
          </AnimationProvider>
        </HStack>
      </VStack>
    </ConnectContainerDialog>
  );
};

export default UnplugRadioLinkMicrobitDialog;
