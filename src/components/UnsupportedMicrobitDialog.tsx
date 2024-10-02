import {
  Button,
  HStack,
  Heading,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalOverlay,
  Text,
  VStack,
} from "@chakra-ui/react";
import { ReactNode } from "react";
import { FormattedMessage } from "react-intl";
import Link from "./Link";

interface UnsupportedMicrobitDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onStartBluetoothClick: () => void;
  isBluetoothSupported: boolean;
}

const UnsupportedMicrobitDialog = ({
  isOpen,
  onClose,
  onStartBluetoothClick,
  isBluetoothSupported,
}: UnsupportedMicrobitDialogProps) => {
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
        <ModalContent p={8}>
          <ModalBody>
            <VStack width="100%" alignItems="left" gap={5}>
              <Heading as="h2" fontSize="xl" fontWeight="bold">
                <FormattedMessage id="connectMB.unsupportedMicrobit.header" />
              </Heading>
              <VStack gap={5} textAlign="left" w="100%">
                <Text w="100%">
                  <FormattedMessage
                    id="connectMB.unsupportedMicrobit.explain"
                    values={{
                      link: (chunks: ReactNode) => (
                        <Link
                          color="blue.600"
                          href="https://support.microbit.org/support/solutions/articles/19000119162"
                          target="_blank"
                          rel="noopener"
                        >
                          {chunks}
                        </Link>
                      ),
                    }}
                  />
                </Text>
                <Text w="100%">
                  {isBluetoothSupported ? (
                    <FormattedMessage id="connectMB.unsupportedMicrobit.withBluetooth" />
                  ) : (
                    <FormattedMessage
                      id="connectMB.unsupportedMicrobit.withoutBluetooth"
                      values={{
                        link: (chunks: ReactNode) => (
                          <Link
                            color="blue.600"
                            // TODO: Replace with real support link.
                            href="https://support.microbit.org/support/home"
                            target="_blank"
                            rel="noopener"
                          >
                            {chunks}
                          </Link>
                        ),
                      }}
                    />
                  )}
                </Text>
              </VStack>
            </VStack>
          </ModalBody>
          <ModalFooter justifyContent="end" p={0}>
            <HStack gap={5}>
              {isBluetoothSupported ? (
                <Button
                  onClick={onStartBluetoothClick}
                  variant="primary"
                  size="lg"
                >
                  <FormattedMessage id="connectMB.unsupportedMicrobit.ctaWithBluetooth" />
                </Button>
              ) : (
                <Button onClick={onClose} variant="primary" size="lg">
                  <FormattedMessage id="close-action" />
                </Button>
              )}
            </HStack>
          </ModalFooter>
        </ModalContent>
      </ModalOverlay>
    </Modal>
  );
};

export default UnsupportedMicrobitDialog;
