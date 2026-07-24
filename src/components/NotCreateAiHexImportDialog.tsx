/**
 * (c) 2024, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import {
  Button,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalFooter,
  ModalHeader,
  ModalProps,
  Text,
} from "@microbit/ui";
import { FormattedMessage } from "react-intl";

const NotCreateAiHexImportDialog = ({
  onClose,
  ...props
}: Omit<ModalProps, "children">) => {
  return (
    <Modal
      isDismissable={false}
      motionless
      size="lg"
      isCentered
      onClose={onClose}
      {...props}
    >
      <ModalHeader>
        <FormattedMessage id="not-create-ai-hex-import-dialog-title" />
      </ModalHeader>
      <ModalBody>
        <ModalCloseButton />
        <Text>
          <FormattedMessage id="not-create-ai-hex-import-dialog-content" />
        </Text>
      </ModalBody>
      <ModalFooter>
        <Button variant="primary" onPress={onClose}>
          <FormattedMessage id="close-action" />
        </Button>
      </ModalFooter>
    </Modal>
  );
};

export default NotCreateAiHexImportDialog;
