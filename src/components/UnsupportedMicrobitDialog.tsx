/**
 * (c) 2024, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import {
  Button,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  Text,
  VStack,
} from "../shared-ui";
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
      isDismissable={false}
      motionless
      isOpen={isOpen}
      onClose={onClose}
      size={{ base: "full", md: "3xl" }}
      isCentered
    >
      <ModalHeader>
        <FormattedMessage id="unsupported-device-header" />
      </ModalHeader>
      <ModalBody>
        <VStack gap={5} textAlign="left" w="100%">
          <Text w="100%">
            <FormattedMessage
              id="unsupported-device-explain"
              values={{
                link: (chunks: ReactNode) => (
                  <Link
                    color="brand.600"
                    textDecoration="underline"
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
              <FormattedMessage id="unsupported-device-with-bluetooth" />
            ) : (
              <FormattedMessage
                id="unsupported-device-without-bluetooth"
                values={{
                  link: (chunks: ReactNode) => (
                    <Link
                      color="brand.600"
                      textDecoration="underline"
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
      <ModalFooter>
        {isBluetoothSupported ? (
          <Button onPress={onStartBluetoothClick} variant="primary" size="lg">
            <FormattedMessage id="connect-with-web-bluetooth" />
          </Button>
        ) : (
          <Button onPress={onClose} variant="primary" size="lg">
            <FormattedMessage id="close-action" />
          </Button>
        )}
      </ModalFooter>
    </Modal>
  );
};

export default UnsupportedMicrobitDialog;
