/**
 * (c) 2024, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import {
  Box,
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

export interface DownloadProgressDialogProps {
  isOpen: boolean;
  headingId: string;
  stage: ProgressStage | undefined;
  progress: number | undefined;
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
}: DownloadProgressDialogProps) => {
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
              {isIndeterminate ? (
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
          <ModalFooter />
        </ModalContent>
      </ModalOverlay>
    </Modal>
  );
};

export default DownloadProgressDialog;
