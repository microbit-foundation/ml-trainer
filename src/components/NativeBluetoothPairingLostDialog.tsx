/**
 * (c) 2024, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import {
  Button,
  HStack,
  Icon,
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
import { RiInformationLine } from "react-icons/ri";
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
                <FormattedMessage id="native-bluetooth-error-forget-device" />
              </Text>
              <VStack textAlign="left" w="100%" gap={3}>
                <OrderedList textAlign="left">
                  <ListItem>
                    <FormattedMessage id="native-bluetooth-error-forget-device-step-1" />
                  </ListItem>
                  <ListItem>
                    <FormattedMessage
                      id="native-bluetooth-error-forget-device-step-2"
                      values={{
                        infoIcon: (chunks: React.ReactNode) => (
                          <Icon
                            as={RiInformationLine}
                            boxSize="1.2em"
                            verticalAlign="text-bottom"
                            color="blue.500"
                            aria-label={String(chunks)}
                            role="img"
                          />
                        ),
                      }}
                    />
                  </ListItem>
                  <ListItem>
                    <FormattedMessage id="native-bluetooth-error-forget-device-step-3" />
                  </ListItem>
                  <ListItem>
                    <FormattedMessage id="native-bluetooth-error-forget-device-step-4" />
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
