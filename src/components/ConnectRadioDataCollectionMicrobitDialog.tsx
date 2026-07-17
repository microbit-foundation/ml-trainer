/**
 * (c) 2024, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { HStack, Image, Text, VStack } from "@microbit/ui";
import { FormattedMessage, useIntl } from "react-intl";
import microbitOnWrist from "../images/stylised-microbit-on-wrist.svg";
import { AnimationProvider } from "./AnimationProvider";
import ConnectContainerDialog, {
  ConnectContainerDialogProps,
} from "./ConnectContainerDialog";
import PlugMicrobitAnimation from "./PlugMicrobitAnimation";

export interface ConnectRadioDataCollectionMicrobitDialogProps
  extends Omit<ConnectContainerDialogProps, "children" | "headingId"> {}

const ConnectRadioDataCollectionMicrobitDialog = ({
  ...props
}: ConnectRadioDataCollectionMicrobitDialogProps) => {
  const intl = useIntl();
  return (
    <ConnectContainerDialog
      headingId="connect-radio-data-collection-microbit-title"
      {...props}
    >
      <VStack gap={5}>
        <Text width="100%">
          <FormattedMessage id="connect-radio-data-collection-microbit-description" />
        </Text>
        <HStack gap={10}>
          <VStack gap={5}>
            <Image
              src={microbitOnWrist}
              alt={intl.formatMessage({
                id: "data-collection-microbit-label",
              })}
              width="220px"
            />
            <Text fontWeight="bold">
              <FormattedMessage id="data-collection-microbit" />
            </Text>
          </VStack>
          <AnimationProvider removeAnimationIfReducedMotion>
            <PlugMicrobitAnimation
              alt={intl.formatMessage({ id: "connect-cable-alt" })}
            />
          </AnimationProvider>
        </HStack>
      </VStack>
    </ConnectContainerDialog>
  );
};

export default ConnectRadioDataCollectionMicrobitDialog;
