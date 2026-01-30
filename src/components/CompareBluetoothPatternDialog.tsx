/**
 * (c) 2024, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { Link, Text, VStack } from "@chakra-ui/react";
import BluetoothPatternInput from "./BluetoothPatternInput";
import ConnectContainerDialog, {
  ConnectContainerDialogProps,
} from "./ConnectContainerDialog";
import { FormattedMessage } from "react-intl";

export interface CompareBluetoothPatternDialogProps
  extends Omit<ConnectContainerDialogProps, "children" | "headingId"> {
  onChangeBluetoothPattern: () => void;
  microbitName: string | undefined;
}

const CompareBluetoothPatternDialog = ({
  onChangeBluetoothPattern,
  microbitName,
  ...props
}: CompareBluetoothPatternDialogProps) => {
  return (
    <ConnectContainerDialog
      headingId="connect-native-compare-pattern-heading"
      footerLeft={
        <Link as="button" color="brand.600" onClick={onChangeBluetoothPattern}>
          <FormattedMessage id="connect-native-change-pattern" />
        </Link>
      }
      {...props}
    >
      <VStack gap={10}>
        <Text width="100%">
          <FormattedMessage id="connect-native-compare-pattern-subtitle" />
        </Text>
        <VStack>
          <BluetoothPatternInput invalid={false} microbitName={microbitName} />
        </VStack>
      </VStack>
    </ConnectContainerDialog>
  );
};

export default CompareBluetoothPatternDialog;
