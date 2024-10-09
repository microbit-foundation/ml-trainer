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
import { ReactNode } from "react";
import { FormattedMessage } from "react-intl";
import { useDeployment } from "../deployment";
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
  const { supportLinks } = useDeployment();
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
            <FormattedMessage id="connectMB.unsupportedMicrobit.header" />
          </ModalHeader>
          <ModalBody>
            <VStack gap={5} textAlign="left" w="100%">
              <Text w="100%">
                <FormattedMessage
                  id="connectMB.unsupportedMicrobit.explain"
                  values={{
                    link: (chunks: ReactNode) => (
                      <Link
                        color="brand.600"
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
                          color="brand.600"
                          href={supportLinks.bluetooth}
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
          </ModalBody>
          <ModalFooter justifyContent="end">
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
