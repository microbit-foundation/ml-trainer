import { Text, VStack } from "@chakra-ui/react";
import { FormattedMessage } from "react-intl";
import ConnectContainerDialog, {
  ConnectContainerDialogProps,
} from "./ConnectContainerDialog";

export interface EnterBluetoothPatternDialogProps
  extends Omit<ConnectContainerDialogProps, "children" | "headingId"> {}

const EnterBluetoothPatternDialog = ({
  ...props
}: EnterBluetoothPatternDialogProps) => {
  // TODO: complete dialog
  return (
    <ConnectContainerDialog headingId="connectMB.pattern.heading" {...props}>
      <VStack gap={10}>
        <Text width="100%">
          <FormattedMessage id="connectMB.pattern.subtitle" />
        </Text>
        <Text textColor="red">
          <FormattedMessage id="connectMB.bluetooth.invalidPattern" />
        </Text>
      </VStack>
    </ConnectContainerDialog>
  );
};

export default EnterBluetoothPatternDialog;
