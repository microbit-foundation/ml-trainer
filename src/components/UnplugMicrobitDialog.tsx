import { Image, Text, VStack } from "@chakra-ui/react";
import { FormattedMessage, useIntl } from "react-intl";
import unplugMicrobit from "../images/unplug-microbit.gif";
import ConnectContainerDialog, {
  ConnectContainerDialogProps,
} from "./ConnectContainerDialog";

export interface ConnectCableDialogProps
  extends Omit<ConnectContainerDialogProps, "children" | "headingId"> {}

const UnplugMicrobitDialog = ({ ...props }: ConnectCableDialogProps) => {
  const intl = useIntl();
  return (
    <ConnectContainerDialog headingId="unplug-bridge-microbit-title" {...props}>
      <VStack gap={5}>
        <Text width="100%">
          <FormattedMessage id="unplug-bridge-microbit-description" />
        </Text>
        <Image
          src={unplugMicrobit}
          alt={intl.formatMessage({
            id: "unplug-bridge-microbit-label",
          })}
          objectFit="contain"
          boxSize="241px"
        />
      </VStack>
    </ConnectContainerDialog>
  );
};

export default UnplugMicrobitDialog;
