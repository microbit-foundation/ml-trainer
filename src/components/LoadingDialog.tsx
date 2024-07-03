import {
  Heading,
  Modal,
  ModalBody,
  ModalContent,
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
    >
      <ModalOverlay>
        <ModalContent p={8}>
          <ModalBody>
            <VStack width="100%" alignItems="left" gap={5}>
              <Heading as="h1" fontWeight="bold" fontSize="2xl">
                <FormattedMessage id={headingId} />
              </Heading>
              <VStack gap={5}>
                <Text>
                  <FormattedMessage id="connectMB.connecting" />
                </Text>
                <LoadingAnimation />
              </VStack>
            </VStack>
          </ModalBody>
        </ModalContent>
      </ModalOverlay>
    </Modal>
  );
};

export default LoadingDialog;
