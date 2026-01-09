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
import { Capacitor } from "@capacitor/core";
import { ProgressStage } from "@microbit/microbit-connection";
import { FormattedMessage } from "react-intl";
import { ConnectionFlowType } from "../connection-stage-hooks";
import ChooseDeviceOverlay from "./ChooseDeviceOverlay";
import LoadingAnimation from "./LoadingAnimation";

export interface DownloadProgressDialogProps {
  isOpen: boolean;
  headingId: string;
  stage: ProgressStage | undefined;
  progress: number | undefined;
}

export const getHeadingId = (flowType: ConnectionFlowType) => {
  switch (flowType) {
    case ConnectionFlowType.ConnectWebBluetooth:
    case ConnectionFlowType.ConnectNativeBluetooth:
    case ConnectionFlowType.ConnectRadioRemote:
      return "downloading-data-collection-header";
    case ConnectionFlowType.ConnectRadioBridge:
      return "downloading-radio-link-header";
  }
};

const getSubtitleId = (stage: ProgressStage | undefined): string => {
  switch (stage) {
    case ProgressStage.Initializing:
      return "downloading-stage-initializing";
    case ProgressStage.FindingDevice:
      return "downloading-stage-finding-device";
    case ProgressStage.Connecting:
      return "downloading-stage-connecting";
    case ProgressStage.PartialFlashing:
    case ProgressStage.FullFlashing:
      return "downloading-stage-flashing";
    default:
      return "downloading-subtitle";
  }
};

const noop = () => {};

const DownloadProgressDialog = ({
  isOpen,
  headingId,
  stage,
  progress,
}: DownloadProgressDialogProps) => {
  // Initializing is quick and always first - skip showing dialog for it.
  // On native the user might get Bluetooth permission dialogs at this point.
  if (stage === ProgressStage.Initializing) {
    return null;
  }
  // On web, show overlay instead of dialog while browser device picker is open.
  // On native, show progress dialog during device scanning.
  if (!Capacitor.isNativePlatform() && stage === ProgressStage.FindingDevice) {
    return <ChooseDeviceOverlay />;
  }
  const isIndeterminate = progress === undefined;
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
                <FormattedMessage id={getSubtitleId(stage)} />
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
