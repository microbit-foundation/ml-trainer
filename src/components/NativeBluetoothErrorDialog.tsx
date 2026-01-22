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

/**
 * Message ID prefix that determines heading and body text:
 * - no-matching-device: No micro:bit matching the pattern was found during scan
 * - native-bluetooth-error: Connection or flash failed for other reasons
 */
export type NativeBluetoothErrorVariant =
  | "no-matching-device"
  | "native-bluetooth-error";

interface NativeBluetoothErrorDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onTryAgain: () => void;
  variant: NativeBluetoothErrorVariant;
}

/**
 * Error dialog for native Bluetooth connection/flash failures.
 *
 * Shows troubleshooting advice relevant to native Bluetooth:
 * - Check the pattern is correct
 * - Check the micro:bit is in Bluetooth mode
 * - Check the micro:bit is close to this device
 */
const NativeBluetoothErrorDialog = ({
  isOpen,
  onClose,
  onTryAgain,
  variant,
}: NativeBluetoothErrorDialogProps) => {
  return (
    <Modal
      closeOnOverlayClick={false}
      motionPreset="none"
      isOpen={isOpen}
      onClose={onClose}
      size="lg"
      isCentered
    >
      <ModalOverlay>
        <ModalContent>
          <ModalHeader>
            <FormattedMessage id={`${variant}-heading`} />
          </ModalHeader>
          <ModalBody>
            <VStack width="100%" alignItems="left" gap={5}>
              <Text textAlign="left" w="100%">
                <FormattedMessage id={`${variant}-body`} />
              </Text>
              <VStack textAlign="left" w="100%" gap={3}>
                <Text w="100%">
                  <FormattedMessage id="native-bluetooth-error-check" />
                </Text>
                <UnorderedList textAlign="left" w="100%" ml={20}>
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
