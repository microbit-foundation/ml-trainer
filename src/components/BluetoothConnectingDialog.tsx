/**
 * (c) 2026, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Text,
  VStack,
} from "@chakra-ui/react";
import { ProgressStage } from "@microbit/microbit-connection";
import { FormattedMessage } from "react-intl";
import { isNativePlatform } from "../platform";
import ChooseDeviceOverlay from "./ChooseDeviceOverlay";
import LoadingAnimation from "./LoadingAnimation";
import { getLegacyTextIdIfNeeded } from "../get-legacy-text-id";

export interface BluetoothConnectingDialogProps {
  isOpen: boolean;
  stage: ProgressStage | undefined;
}

const noop = () => {};

const BluetoothConnectingDialog = ({
  isOpen,
  stage,
}: BluetoothConnectingDialogProps) => {
  // Skip showing dialog when stage is undefined (not yet started).
  if (stage === undefined) {
    return null;
  }
  // On web, show overlay instead of dialog while browser device picker is open.
  // On native, show progress dialog during device scanning.
  if (
    !isNativePlatform() &&
    (stage === ProgressStage.FindingDevice ||
      stage === ProgressStage.Initializing)
  ) {
    return <ChooseDeviceOverlay />;
  }
  return (
    <Modal
      closeOnOverlayClick={false}
      motionPreset="none"
      isOpen={isOpen}
      onClose={noop}
      size={{ base: "full", md: "3xl" }}
      isCentered
      preserveScrollBarGap={false}
    >
      <ModalOverlay>
        <ModalContent>
          <ModalHeader>
            <FormattedMessage
              id={getLegacyTextIdIfNeeded({
                legacyId: "connect-bluetooth-heading",
                id: "connecting-data-collection-microbit-heading",
              })}
            />
          </ModalHeader>
          <ModalBody>
            <VStack width="100%" gap={5} alignItems="center">
              <Text textAlign="center">
                <FormattedMessage
                  id={getLegacyTextIdIfNeeded({
                    legacyId: "connecting",
                    id: "downloading-stage-connecting",
                  })}
                />
              </Text>
              <LoadingAnimation />
            </VStack>
          </ModalBody>
          <ModalFooter />
        </ModalContent>
      </ModalOverlay>
    </Modal>
  );
};

export default BluetoothConnectingDialog;
