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

  const handleNextClick = useCallback(() => {
    if (!microbitName || microbitName.includes(" ")) {
      setShowInvalid(true);
      return;
    }
    onNextClick && onNextClick();
  }, [microbitName, onNextClick]);

  const handleBackClick = useCallback(() => {
    setShowInvalid(false);
    onBackClick && onBackClick();
  }, [onBackClick]);

  const handleNameChange = useCallback(
    (name: string) => {
      onChangeMicrobitName(name);
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
            onChange={handleNameChange}
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

export default EnterBluetoothPatternDialog;
