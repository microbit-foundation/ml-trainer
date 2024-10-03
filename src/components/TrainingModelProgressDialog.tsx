import {
  Heading,
  Modal,
  ModalBody,
  ModalContent,
  ModalOverlay,
  Progress,
  VStack,
} from "@chakra-ui/react";
import { FormattedMessage } from "react-intl";

export interface DownloadingDialogProps {
  isOpen: boolean;
  progress: number;
}

const TrainingModelProgressDialog = ({
  isOpen,
  progress,
}: DownloadingDialogProps) => {
  return (
    <Modal
      closeOnOverlayClick={false}
      motionPreset="none"
      isOpen={isOpen}
      onClose={() => {}}
      size="2xl"
      isCentered
    >
      <ModalOverlay>
        <ModalContent p={8}>
          <ModalBody>
            <VStack width="100%" alignItems="left" gap={5}>
              <Heading as="h1" fontWeight="bold" fontSize="2xl">
                <FormattedMessage id="content.trainer.training.title" />
              </Heading>
              <Progress
                value={progress}
                colorScheme="brand2"
                size="md"
                rounded={100}
              />
            </VStack>
          </ModalBody>
        </ModalContent>
      </ModalOverlay>
    </Modal>
  );
};

export default TrainingModelProgressDialog;
