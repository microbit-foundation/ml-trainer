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
  ModalFooter,
  ModalHeader,
  Text,
  VStack,
} from "../shared-ui";
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
      isDismissable={false}
      motionless
      isOpen={isOpen}
      onClose={onClose}
      size={{ base: "full", md: "3xl" }}
      isCentered
    >
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
      <ModalFooter>
        <HStack gap={5}>
          <Button onPress={onClose} variant="primary" size="lg">
            <FormattedMessage id="close-action" />
          </Button>
        </HStack>
      </ModalFooter>
    </Modal>
  );
};

export default WebUsbBluetoothUnsupportedDialog;
