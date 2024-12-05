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
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Text,
} from "@chakra-ui/react";
import { ComponentProps } from "react";
import { FormattedMessage } from "react-intl";

const TrainModelInsufficientDataDialog = ({
  onClose,
  ...rest
}: Omit<ComponentProps<typeof Modal>, "children">) => {
  return (
    <Modal
      closeOnOverlayClick={false}
      motionPreset="none"
      size="lg"
      isCentered
      onClose={onClose}
      {...rest}
    >
      <ModalOverlay>
        <ModalContent>
          <ModalHeader>
            <FormattedMessage id="insufficient-data-title" />
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Text>
              <FormattedMessage id="insufficient-data-body" />
            </Text>
          </ModalBody>
          <ModalFooter justifyContent="flex-end">
            <Button variant="primary" onClick={onClose}>
              <FormattedMessage id="close-action" />
            </Button>
          </ModalFooter>
        </ModalContent>
      </ModalOverlay>
    </Modal>
  );
};

export default TrainModelInsufficientDataDialog;
