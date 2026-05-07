/**
 * (c) 2024, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import {
  Button,
  HStack,
  ListItem,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Text,
  UnorderedList,
  VStack,
} from "@chakra-ui/react";
import { FormattedMessage } from "react-intl";

interface NativeBluetoothErrorDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onTryAgain: () => void;
}

/**
 * Error dialog for native Bluetooth connection/flash failures for when we've not previously connected.
 */
const NativeBluetoothErrorDialog = ({
  isOpen,
  onClose,
  onTryAgain,
}: NativeBluetoothErrorDialogProps) => {
  return (
    <Modal
      closeOnOverlayClick={false}
      motionPreset="none"
      isOpen={isOpen}
      onClose={onClose}
      size={{ base: "full", md: "xl" }}
      isCentered
    >
      <ModalOverlay>
        <ModalContent>
          <ModalHeader>
            <FormattedMessage id="native-bluetooth-error-heading" />
          </ModalHeader>
          <ModalBody>
            <VStack width="100%" alignItems="left" gap={5}>
              <Text textAlign="left" w="100%">
                <FormattedMessage id="native-bluetooth-error-body" />
              </Text>
              <VStack textAlign="left" w="100%" gap={3}>
                <Text w="100%">
                  <FormattedMessage id="native-bluetooth-error-check" />
                </Text>
                <UnorderedList textAlign="left" ps={8}>
                  <ListItem>
                    <Text>
                      <FormattedMessage id="native-bluetooth-error-check-mode" />
                    </Text>
                  </ListItem>
                  <ListItem>
                    <Text>
                      <FormattedMessage id="native-bluetooth-error-check-pattern" />
                    </Text>
                  </ListItem>
                  <ListItem>
                    <Text>
                      <FormattedMessage id="native-bluetooth-error-check-distance" />
                    </Text>
                  </ListItem>
                </UnorderedList>
              </VStack>
            </VStack>
          </ModalBody>
          <ModalFooter justifyContent="end">
            <HStack gap={5}>
              <Button onClick={onClose} variant="secondary" size="lg">
                <FormattedMessage id="cancel-action" />
              </Button>
              <Button onClick={onTryAgain} variant="primary" size="lg">
                <FormattedMessage id="try-again-action" />
              </Button>
            </HStack>
          </ModalFooter>
        </ModalContent>
      </ModalOverlay>
    </Modal>
  );
};

export default NativeBluetoothErrorDialog;
