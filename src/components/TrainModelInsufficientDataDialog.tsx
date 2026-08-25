/**
 * (c) 2024, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import {
  Button,
  ControlledModalProps,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalFooter,
  ModalHeader,
  Text,
} from "@microbit/ui";

import { FormattedMessage } from "react-intl";

const TrainModelInsufficientDataDialog = ({
  onClose,
  ...rest
}: Omit<ControlledModalProps, "children">) => {
  return (
    <Modal
      isDismissable={false}
      motionless
      size="lg"
      isCentered
      onClose={onClose}
      {...rest}
    >
      <ModalHeader>
        <FormattedMessage id="insufficient-data-title" />
      </ModalHeader>
      <ModalCloseButton />
      <ModalBody>
        <Text>
          <FormattedMessage id="insufficient-data-body" />
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

export default TrainModelInsufficientDataDialog;
