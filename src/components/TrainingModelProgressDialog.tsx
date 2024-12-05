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
  Progress,
  VStack,
} from "@chakra-ui/react";
import { FormattedMessage } from "react-intl";

export interface DownloadingDialogProps {
  isOpen: boolean;
  progress: number;
  finalFocusRef?: React.RefObject<HTMLButtonElement>;
}

const TrainingModelProgressDialog = ({
  isOpen,
  progress,
  finalFocusRef,
}: DownloadingDialogProps) => {
  return (
    <Modal
      closeOnOverlayClick={false}
      motionPreset="none"
      isOpen={isOpen}
      onClose={() => {}}
      size="2xl"
      isCentered
      finalFocusRef={finalFocusRef}
    >
      <ModalOverlay>
        <ModalContent>
          <ModalHeader>
            <FormattedMessage id="training-model" />
          </ModalHeader>
          <ModalBody>
            <VStack width="100%" alignItems="left">
              <Progress
                value={progress}
                colorScheme="brand2"
                size="md"
                rounded={100}
              />
            </VStack>
          </ModalBody>
          <ModalFooter />
        </ModalContent>
      </ModalOverlay>
    </Modal>
  );
};

export default TrainingModelProgressDialog;
