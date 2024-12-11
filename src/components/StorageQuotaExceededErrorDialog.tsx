/**
 * (c) 2024, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
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
import { FormattedMessage } from "react-intl";

interface StorageQuotaExceededErrorDialogProps {
  isOpen: boolean;
}

const StorageQuotaExceededErrorDialog = ({
  isOpen,
}: StorageQuotaExceededErrorDialogProps) => {
  return (
    <Modal
      motionPreset="none"
      isOpen={isOpen}
      onClose={() => {}}
      size="2xl"
      isCentered
    >
      <ModalOverlay>
        <ModalContent>
          <ModalHeader>
            <FormattedMessage id="storage-quota-exceeded-dialog-title" />
          </ModalHeader>
          <ModalBody>
            <VStack textAlign="left" w="100%">
              <Text w="100%">
                <FormattedMessage id="storage-quota-exceeded-dialog-body" />
              </Text>
            </VStack>
          </ModalBody>
          <ModalFooter justifyContent="flex-end">
            <HStack gap={5}>
              <Button
                onClick={() => window.location.reload()}
                variant="primary"
                size="lg"
              >
                <FormattedMessage id="reload-action" />
              </Button>
            </HStack>
          </ModalFooter>
        </ModalContent>
      </ModalOverlay>
    </Modal>
  );
};

export default StorageQuotaExceededErrorDialog;
