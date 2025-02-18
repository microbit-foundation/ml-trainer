/**
 * (c) 2024, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import {
  Button,
  HStack,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Text,
  VStack,
} from "@chakra-ui/react";
import { FormattedMessage } from "react-intl";

interface WebUsbBluetoothUnsupportedDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const WebUsbBluetoothUnsupportedDialog = ({
  isOpen,
  onClose,
}: WebUsbBluetoothUnsupportedDialogProps) => {
  return (
    <Modal
      closeOnOverlayClick={false}
      motionPreset="none"
      isOpen={isOpen}
      onClose={onClose}
      size="3xl"
      isCentered
    >
      <ModalOverlay>
        <ModalContent>
          <ModalHeader>
            <FormattedMessage id="bluetooth-unsupported-header" />
          </ModalHeader>
          <ModalBody>
            <VStack gap={5} textAlign="left" w="100%">
              <Text w="100%">
                <FormattedMessage id="bluetooth-unsupported-explain" />
              </Text>
              <Text w="100%">
                <FormattedMessage id="bluetooth-unsupported-advice" />
              </Text>
            </VStack>
          </ModalBody>
          <ModalFooter justifyContent="end">
            <HStack gap={5}>
              <Button onClick={onClose} variant="primary" size="lg">
                <FormattedMessage id="close-action" />
              </Button>
            </HStack>
          </ModalFooter>
        </ModalContent>
      </ModalOverlay>
    </Modal>
  );
};

export default WebUsbBluetoothUnsupportedDialog;
