/**
 * (c) 2024, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import {
  Button,
  ListItem,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  Text,
  UnorderedList,
  VStack,
} from "../shared-ui";
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
      isDismissable={false}
      motionless
      isOpen={isOpen}
      onClose={onClose}
      size={{ base: "full", md: "xl" }}
      isCentered
    >
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
      <ModalFooter>
        <Button onPress={onClose} variant="secondary" size="lg">
          <FormattedMessage id="cancel-action" />
        </Button>
        <Button onPress={onTryAgain} variant="primary" size="lg">
          <FormattedMessage id="try-again-action" />
        </Button>
      </ModalFooter>
    </Modal>
  );
};

export default NativeBluetoothErrorDialog;
