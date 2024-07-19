import { Text, VStack } from "@chakra-ui/react";
import { useCallback, useState } from "react";
import { FormattedMessage } from "react-intl";
import BluetoothPatternInput from "./BluetoothPatternInput";
import ConnectContainerDialog, {
  ConnectContainerDialogProps,
} from "./ConnectContainerDialog";
import { BluetoothPattern } from "../bt-pattern-utils";

export interface EnterBluetoothPatternDialogProps
  extends Omit<ConnectContainerDialogProps, "children" | "headingId"> {
  setBluetoothPattern: (pattern: BluetoothPattern) => void;
  bluetoothPattern: BluetoothPattern;
}

const EnterBluetoothPatternDialog = ({
  onNextClick,
  onBackClick,
  setBluetoothPattern,
  bluetoothPattern,
  ...props
}: EnterBluetoothPatternDialogProps) => {
  const [showInvalid, setShowInvalid] = useState<boolean>(false);

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
      setShowInvalid(false);
    },
    [setBluetoothPattern]
  );

  return (
    <ConnectContainerDialog
      onNextClick={handleNextClick}
      onBackClick={handleBackClick}
      headingId="connectMB.pattern.heading"
      {...props}
    >
      <VStack gap={10}>
        <Text width="100%">
          <FormattedMessage id="connectMB.pattern.subtitle" />
        </Text>
        <VStack>
          <BluetoothPatternInput
            pattern={bluetoothPattern}
            onChange={handlePatternChange}
            invalid={showInvalid}
          />
          <Text textColor="red" opacity={showInvalid ? 1 : 0}>
            <FormattedMessage id="connectMB.bluetooth.invalidPattern" />
          </Text>
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
