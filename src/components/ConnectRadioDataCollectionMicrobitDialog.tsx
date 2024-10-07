import { HStack, Image, Text, VStack } from "@chakra-ui/react";
import { FormattedMessage, useIntl } from "react-intl";
import connectCable from "../images/connect-cable.gif";
import microbitOnWrist from "../images/stylised-microbit-on-wrist.svg";
import ConnectContainerDialog, {
  ConnectContainerDialogProps,
} from "./ConnectContainerDialog";

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
          <Image
            src={connectCable}
            alt={intl.formatMessage({ id: "connectMB.connectCable.altText" })}
            objectFit="contain"
            boxSize="241px"
          />
        </HStack>
      </VStack>
    </ConnectContainerDialog>
  );
};

export default ConnectRadioDataCollectionMicrobitDialog;
