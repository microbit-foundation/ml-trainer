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
import LoadingAnimation from "./LoadingAnimation";

export interface LoadingDialogProps {
  headingId: string;
  isOpen: boolean;
}

const LoadingDialog = ({ headingId, isOpen }: LoadingDialogProps) => {
  return (
    <Modal
      closeOnOverlayClick={false}
      motionPreset="none"
      isOpen={isOpen}
      onClose={() => {}}
      size="3xl"
      isCentered
    >
      <ModalOverlay>
        <ModalContent>
          <ModalHeader>
            <FormattedMessage id={headingId} />
          </ModalHeader>
          <ModalBody>
            <VStack gap={5} width="100%" alignItems="center">
              <Text>
                <FormattedMessage id="connectMB.connecting" />
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

export default LoadingDialog;
