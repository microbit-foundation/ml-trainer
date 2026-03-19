/**
 * (c) 2024, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { Text, VStack } from "@chakra-ui/react";
import { useCallback, useState } from "react";
import { FormattedMessage } from "react-intl";
import { blank } from "../bt-pattern-utils";
import BluetoothPatternInput from "./BluetoothPatternInput";
import ConnectContainerDialog, {
  ConnectContainerDialogProps,
} from "./ConnectContainerDialog";
import { isNativePlatform } from "../platform";

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
  const [value, setValue] = useState<string | undefined>(
    isNativePlatform() ? undefined : microbitName
  );

  const handleNextClick = useCallback(() => {
    if (!value || value.includes(blank)) {
      setShowInvalid(true);
      return;
    }
    onChangeMicrobitName(value);
    onNextClick && onNextClick();
  }, [onChangeMicrobitName, onNextClick, value]);

  const handleBackClick = useCallback(() => {
    setShowInvalid(false);
    onBackClick && onBackClick();
  }, [onBackClick]);

  const handleNameChange = useCallback((name: string) => {
    setValue(name);
    setShowInvalid(false);
  }, []);

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
            onChange={handleNameChange}
            invalid={showInvalid}
            microbitName={value}
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

export default EnterBluetoothPatternDialog;
