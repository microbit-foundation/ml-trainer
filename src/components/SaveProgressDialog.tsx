/**
 * (c) 2024, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import {
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
import { useStore } from "../store";
import { SaveType } from "../model";
import LoadingAnimation from "./LoadingAnimation";

export interface SavingDialogProps {
  isOpen: boolean;
}

const SaveProgressDialog = ({ isOpen }: SavingDialogProps) => {
  const isShare = useStore((s) => s.save.type) === SaveType.Share;
  const sharingOrSaving = isShare ? "sharing" : "saving";

  return (
    <Modal
      closeOnOverlayClick={false}
      motionPreset="none"
      isOpen={isOpen}
      onClose={() => {}}
      size={{ base: "full", md: "3xl" }}
      isCentered
    >
      <ModalOverlay>
        <ModalContent>
          <ModalHeader>
            <FormattedMessage id={`${sharingOrSaving}-title`} />
          </ModalHeader>
          <ModalBody>
            <VStack width="100%" alignItems="center" gap={5}>
              <Text textAlign="center">
                <FormattedMessage id={`${sharingOrSaving}-description`} />
              </Text>
              <LoadingAnimation />
            </VStack>
          </ModalBody>
          <ModalFooter />
        </ModalContent>
      </ModalOverlay>
    </Modal>
  );
};

export default SaveProgressDialog;
