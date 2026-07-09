/**
 * (c) 2024, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import {
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  Text,
  VStack,
} from "../shared-ui";
import { FormattedMessage } from "react-intl";
import LoadingAnimation from "./LoadingAnimation";

export interface LoadingDialogProps {
  headingId: string;
  isOpen: boolean;
}

const LoadingDialog = ({ headingId, isOpen }: LoadingDialogProps) => {
  return (
    <Modal
      isDismissable={false}
      motionless
      isOpen={isOpen}
      onClose={() => {}}
      size={{ base: "full", md: "3xl" }}
      isCentered
    >
      <ModalHeader>
        <FormattedMessage id={headingId} />
      </ModalHeader>
      <ModalBody>
        <VStack gap={5} width="100%">
          <Text>
            <FormattedMessage id="connecting" />
          </Text>
          <LoadingAnimation />
        </VStack>
      </ModalBody>
      <ModalFooter />
    </Modal>
  );
};

export default LoadingDialog;
