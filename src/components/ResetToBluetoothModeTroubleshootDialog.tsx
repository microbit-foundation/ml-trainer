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
} from "@microbit/ui";
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
      isDismissable={false}
      motionless
      isOpen={isOpen}
      onClose={onClose}
      size={{ base: "full", md: "xl" }}
      isCentered
    >
      <ModalHeader>
        <FormattedMessage id="connect-unable-to-enter-bluetooth-mode-heading" />
      </ModalHeader>
      <ModalBody>
        <VStack textAlign="left" w="100%" gap={3}>
          <Text w="100%">
            <FormattedMessage id="connect-unable-to-enter-bluetooth-mode-troubleshooting" />
          </Text>
          <UnorderedList textAlign="left" ps={8}>
            <ListItem>
              <Text>
                <FormattedMessage id="connect-unable-to-enter-bluetooth-mode-troubleshooting-1" />
              </Text>
            </ListItem>
            <ListItem>
              <Text>
                <FormattedMessage id="connect-unable-to-enter-bluetooth-mode-troubleshooting-2" />
              </Text>
            </ListItem>
          </UnorderedList>
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

export default ResetToBluetoothModeTroubleshootDialog;
