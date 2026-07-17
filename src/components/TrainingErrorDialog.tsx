/**
 * (c) 2024, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import {
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalFooter,
  ModalHeader,
  ModalProps,
  Text,
  VStack,
} from "@microbit/ui";
import { FormattedMessage } from "react-intl";

const TrainingErrorDialog = ({ ...rest }: Omit<ModalProps, "children">) => {
  return (
    <Modal motionless size="lg" isCentered {...rest}>
      <ModalHeader>
        <FormattedMessage id="train-error-header" />
      </ModalHeader>
      <ModalCloseButton />
      <ModalBody>
        <VStack gap={3} textAlign="left" w="100%">
          <Text w="100%">
            <FormattedMessage id="train-error-body" />
          </Text>
          <Text w="100%" fontWeight="bold">
            <FormattedMessage id="train-error-todo" />
          </Text>
        </VStack>
      </ModalBody>
      <ModalFooter />
    </Modal>
  );
};

export default TrainingErrorDialog;
