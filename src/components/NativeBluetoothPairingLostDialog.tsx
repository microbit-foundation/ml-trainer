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
  OrderedList,
  Text,
  VStack,
} from "@chakra-ui/react";
import { FormattedMessage } from "react-intl";

interface NativeBluetoothPairingLostDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onTryAgain: () => void;
}

/**
 * Error dialog for iOS Bluetooth pairing information has been lost.
 * This can happen when the user flashes the paired micro:bit using the computer.
 */
const NativeBluetoothPairingLostDialog = ({
  isOpen,
  onClose,
  onTryAgain,
}: NativeBluetoothPairingLostDialogProps) => {
  return (
    <Modal
      closeOnOverlayClick={false}
      motionPreset="none"
      isOpen={isOpen}
      onClose={onClose}
      size="xl"
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
                Please forget this device in your Bluetooth settings and try
                again.
              </Text>
              <VStack textAlign="left" w="100%" gap={3}>
                <OrderedList textAlign="left">
                  <ListItem>
                    <Text>Go to the Settings app &gt; Bluetooth</Text>
                  </ListItem>
                  <ListItem>
                    <Text>Tap the (i) icon next to the BBC micro:bit device</Text>
                  </ListItem>
                  <ListItem>
                    <Text>Tap "Forget This Device"</Text>
                  </ListItem>
                  <ListItem>
                    <Text>Return to this app to try again</Text>
                  </ListItem>
                </OrderedList>
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

export default NativeBluetoothPairingLostDialog;
