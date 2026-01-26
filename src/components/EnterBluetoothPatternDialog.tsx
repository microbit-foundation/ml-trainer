/**
 * (c) 2024, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { Text, VStack } from "@chakra-ui/react";
import { useCallback, useState } from "react";
import { FormattedMessage } from "react-intl";
import BluetoothPatternInput from "./BluetoothPatternInput";
import ConnectContainerDialog, {
  ConnectContainerDialogProps,
} from "./ConnectContainerDialog";
import {
  BluetoothPattern,
  microbitNameToBluetoothPattern,
  microbitPatternToName,
} from "../bt-pattern-utils";

export interface EnterBluetoothPatternDialogProps
  extends Omit<ConnectContainerDialogProps, "children" | "headingId"> {
  onChangeMicrobitName: (name: string) => void;
  microbitName: string | undefined;
}

const EnterBluetoothPatternDialog = ({
  onNextClick,
  onBackClick,
  onChangeMicrobitName,
  microbitName,
  ...props
}: EnterBluetoothPatternDialogProps) => {
  const [showInvalid, setShowInvalid] = useState<boolean>(false);
  const [bluetoothPattern, setBluetoothPattern] = useState<BluetoothPattern>(
    microbitName
      ? microbitNameToBluetoothPattern(microbitName)
      : Array(25).fill(false)
  );

  const handleNextClick = useCallback(() => {
    if (!isPatternValid(bluetoothPattern)) {
      setShowInvalid(true);
      return;
    }
    onNextClick && onNextClick();
  }, [bluetoothPattern, onNextClick]);

  const handleBackClick = useCallback(() => {
    setShowInvalid(false);
    onBackClick && onBackClick();
  }, [onBackClick]);

  const handlePatternChange = useCallback(
    (newPattern: BluetoothPattern) => {
      setBluetoothPattern(newPattern);
      onChangeMicrobitName(microbitPatternToName(newPattern));
      setShowInvalid(false);
    },
    [onChangeMicrobitName]
  );

  return (
    <ConnectContainerDialog
      onNextClick={handleNextClick}
      onBackClick={handleBackClick}
      headingId="connect-pattern-heading"
      {...props}
    >
      <VStack gap={10}>
        <Text width="100%">
          <FormattedMessage id="connect-pattern-subtitle" />
        </Text>
        <VStack>
          <BluetoothPatternInput
            pattern={bluetoothPattern}
            onChange={handlePatternChange}
            invalid={showInvalid}
            microbitName={microbitName}
          />
          <VStack>
            <Text
              textColor="red"
              opacity={showInvalid ? 1 : 0}
              aria-hidden={!showInvalid}
            >
              <FormattedMessage id="connect-bluetooth-invalid-pattern" />
            </Text>
          </VStack>
        </VStack>
      </VStack>
    </ConnectContainerDialog>
  );
};

const isPatternValid = (pattern: BluetoothPattern) => {
  for (let col = 0; col < 5; col++) {
    let isAnyHighlighted = false;
    for (let row = 0; row < 5; row++) {
      if (pattern[row * 5 + col]) {
        isAnyHighlighted = true;
      }
    }
    if (!isAnyHighlighted) {
      return false;
    }
  }
  return true;
};

export default EnterBluetoothPatternDialog;
