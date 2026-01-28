/**
 * (c) 2024, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { Button, Text, VStack } from "@chakra-ui/react";
import { useCallback } from "react";
import BluetoothPatternInput from "./BluetoothPatternInput";
import ConnectContainerDialog, {
  ConnectContainerDialogProps,
} from "./ConnectContainerDialog";

export interface CompareBluetoothPatternDialogProps
  extends Omit<ConnectContainerDialogProps, "children" | "headingId"> {
  onEditBluetoothPattern: () => void;
  microbitName: string | undefined;
}

const CompareBluetoothPatternDialog = ({
  onNextClick,
  onBackClick,
  onEditBluetoothPattern: onChangeMicrobitName,
  microbitName,
  ...props
}: CompareBluetoothPatternDialogProps) => {

  const handleNextClick = useCallback(() => {
    onNextClick && onNextClick();
  }, [onNextClick]);

  const handleBackClick = useCallback(() => {
    onBackClick && onBackClick();
  }, [onBackClick]);

  return (
    <ConnectContainerDialog
      onNextClick={handleNextClick}
      onBackClick={handleBackClick}
      headingId="Compare pattern"
      footerLeft={
        <Button onClick={onChangeMicrobitName} variant="link" size="lg">
          My pattern is different
        </Button>
      }
      {...props}
    >
      <VStack gap={10}>
        <Text width="100%">
          Compare this pattern with the one displayed on your micro:bit.
        </Text>
        <VStack>
          <BluetoothPatternInput invalid={false} microbitName={microbitName} />
        </VStack>
      </VStack>
    </ConnectContainerDialog>
  );
};

export default CompareBluetoothPatternDialog;
