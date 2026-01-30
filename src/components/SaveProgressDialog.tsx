/**
 * (c) 2024, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { Capacitor } from "@capacitor/core";
import {
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
import { FormattedMessage } from "react-intl";

export interface SavingDialogProps {
  isOpen: boolean;
}

const SaveProgressDialog = ({ isOpen }: SavingDialogProps) => {
  const isShare = Capacitor.isNativePlatform();
  const progressTitleId = isShare ? "sharing-title" : "saving-title";
  const progressDescriptionId = isShare
    ? "sharing-description"
    : "saving-description";

  return (
    <Modal
      closeOnOverlayClick={false}
      motionPreset="none"
      isOpen={isOpen}
      onClose={() => {}}
      size="2xl"
      isCentered
    >
      <ModalOverlay>
        <ModalContent>
          <ModalHeader>
            <FormattedMessage id={progressTitleId} />
          </ModalHeader>
          <ModalBody>
            <VStack width="100%" alignItems="left" gap={5}>
              <Text>
                <FormattedMessage id={progressDescriptionId} />
              </Text>
              <Progress colorScheme="brand2" isIndeterminate rounded="md" />
            </VStack>
          </ModalBody>
          <ModalFooter />
        </ModalContent>
      </ModalOverlay>
    </Modal>
  );
};

export default SaveProgressDialog;
