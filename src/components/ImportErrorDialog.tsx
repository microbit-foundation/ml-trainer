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
} from "../shared-ui";
import { FormattedMessage } from "react-intl";
import { useDeployment } from "../deployment";

const ImportErrorDialog = ({
  onClose,
  ...props
}: Omit<ModalProps, "children">) => {
  const { appNameFull } = useDeployment();
  return (
    <Modal
      isDismissable={false}
      motionless
      size="md"
      isCentered
      onClose={onClose}
      {...props}
    >
      <ModalHeader>
        <FormattedMessage id="import-error-dialog-title" />
      </ModalHeader>
      <ModalBody>
        <ModalCloseButton />
        <Text>
          <FormattedMessage
            id="import-error-dialog-content"
            values={{ appNameFull }}
          />
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

export default ImportErrorDialog;
