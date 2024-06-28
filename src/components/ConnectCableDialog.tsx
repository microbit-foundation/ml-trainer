import { Image, Text, VStack } from "@chakra-ui/react";
import { FormattedMessage } from "react-intl";
import connectCableImage from "../images/connect-cable.gif";
import ConnectContainerDialog, {
  ConnectContainerDialogProps,
} from "./ConnectContainerDialog";

export interface ConnectCableDialogProps
  extends Omit<ConnectContainerDialogProps, "children"> {
  subtitleId: string;
}

const ConnectCableDialog = ({
  subtitleId,
  ...props
}: ConnectCableDialogProps) => {
  return (
    <ConnectContainerDialog {...props}>
      <VStack gap={10}>
        <Text width="100%">
          <FormattedMessage id={subtitleId} />
        </Text>
        <Image
          src={connectCableImage}
          alt=""
          objectFit="contain"
          boxSize="241px"
        />
      </VStack>
    </ConnectContainerDialog>
  );
};

export default ConnectCableDialog;
