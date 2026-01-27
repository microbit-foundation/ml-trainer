/**
 * (c) 2024, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import {
  Box,
  Button,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Progress,
  Text,
  VStack,
} from "@chakra-ui/react";
import { ProgressStage } from "@microbit/microbit-connection";
import { FormattedMessage } from "react-intl";
import { DataConnectionType, RadioFlowPhase } from "../data-connection-flow";
import { isNativePlatform } from "../platform";
import ChooseDeviceOverlay from "./ChooseDeviceOverlay";
import LoadingAnimation from "./LoadingAnimation";
import BluetoothPatternInput from "./BluetoothPatternInput";
import { useSettings } from "../store";

export interface DownloadProgressDialogProps {
  isOpen: boolean;
  headingId: string;
  stage: ProgressStage | undefined;
  progress: number | undefined;
  tryAgain?: () => void;
}

export const getHeadingId = (
  flowType: DataConnectionType,
  radioFlowPhase?: RadioFlowPhase
): string => {
  switch (flowType) {
    case DataConnectionType.WebBluetooth:
    case DataConnectionType.NativeBluetooth:
      return "downloading-data-collection-header";
    case DataConnectionType.Radio:
      return radioFlowPhase === "bridge"
        ? "downloading-radio-link-header"
        : "downloading-data-collection-header";
  }
};

const getSubtitleId = (
  stage: ProgressStage | undefined
): string | undefined => {
  switch (stage) {
    case ProgressStage.Initializing:
      return undefined;
    case ProgressStage.FindingDevice:
      return "downloading-stage-finding-device";
    case ProgressStage.Connecting:
      return "downloading-stage-connecting";
    case ProgressStage.PartialFlashing:
    case ProgressStage.FullFlashing:
      return "downloading-stage-flashing";
    default:
      throw new Error(stage);
  }
};

const noop = () => {};

const DownloadProgressDialog = ({
  isOpen,
  headingId,
  stage,
  progress,
  tryAgain,
}: DownloadProgressDialogProps) => {
  const [settings] = useSettings();
  // Skip showing dialog when stage is undefined (not yet started).
  if (stage === undefined) {
    return null;
  }
  // On web, show overlay instead of dialog while browser device picker is open.
  // On native, show progress dialog during device scanning.
  if (!isNativePlatform() && stage === ProgressStage.FindingDevice) {
    return <ChooseDeviceOverlay />;
  }
  const isIndeterminate = progress === undefined;
  const subtitleId = getSubtitleId(stage);
  const isFindingDevice = stage === ProgressStage.FindingDevice;
  return (
    <Modal
      closeOnOverlayClick={false}
      motionPreset="none"
      isOpen={isOpen}
      onClose={noop}
      size="3xl"
      isCentered
    >
      <ModalOverlay>
        <ModalContent>
          <ModalHeader>
            <FormattedMessage id={headingId} />
          </ModalHeader>
          <ModalBody>
            <VStack
              width="100%"
              gap={5}
              alignItems={isIndeterminate ? "center" : "flex-start"}
            >
              <Text>
                {subtitleId ? <FormattedMessage id={subtitleId} /> : "\u00A0"}
              </Text>
              {isNativePlatform() && isFindingDevice ? (
                <BluetoothPatternInput
                  microbitName={settings.bluetoothMicrobitName}
                  invalid={false}
                />
              ) : isIndeterminate ? (
                <LoadingAnimation />
              ) : (
                <Box h={25} display="flex" alignItems="center" width="100%">
                  <Progress
                    value={progress * 100}
                    colorScheme="brand2"
                    size="md"
                    rounded={100}
                    width="100%"
                  />
                </Box>
              )}
            </VStack>
          </ModalBody>
          <ModalFooter justifyContent="start">
            {isNativePlatform() && tryAgain && isFindingDevice && (
              <Button onClick={tryAgain} variant="link" size="lg">
                My pattern is different
              </Button>
            )}
          </ModalFooter>
        </ModalContent>
      </ModalOverlay>
    </Modal>
  );
};

export default DownloadProgressDialog;
