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

interface ResetToBluetoothModeTroubleshootDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onTryAgain: () => void;
}

/**
 * Troubleshooting dialog for resetting micro:bit to Bluetooth mode.
 */
const ResetToBluetoothModeTroubleshootDialog = ({
  isOpen,
  onClose,
  onTryAgain,
}: ResetToBluetoothModeTroubleshootDialogProps) => {
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
          <ModalHeader>Unable to enter Bluetooth mode?</ModalHeader>
          <ModalBody>
            <VStack textAlign="left" w="100%" gap={3}>
              <Text w="100%">Try the following:</Text>
              <UnorderedList textAlign="left" ps={8}>
                <ListItem>
                  <Text>
                    Disconnect and then reconnect the micro:bit with the power
                    source.
                  </Text>
                </ListItem>
                <ListItem>
                  <Text>
                    If your micro:bit shows a "+" icon, connect the micro:bit to
                    a computer with a USB cable and download a simple program.
                    Unpair/Forget the micro:bit in the Settings app before
                    trying again.
                  </Text>
                </ListItem>
              </UnorderedList>
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

export default ResetToBluetoothModeTroubleshootDialog;
