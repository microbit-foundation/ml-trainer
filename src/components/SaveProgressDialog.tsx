import {
  Heading,
  Modal,
  ModalBody,
  ModalContent,
  ModalOverlay,
  Progress,
  Text,
  VStack,
} from "@chakra-ui/react";
import { FormattedMessage } from "react-intl";

export interface SavingDialogProps {
  isOpen: boolean;
}

const SaveProgressDialog = ({ isOpen }: SavingDialogProps) => {
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
                <FormattedMessage id="saving-title" />
              </Heading>
              <Text>
                <FormattedMessage id="saving-description" />
              </Text>
              <Progress colorScheme="brand2" isIndeterminate rounded="md" />
            </VStack>
          </ModalBody>
        </ModalContent>
      </ModalOverlay>
    </Modal>
  );
};

export default SaveProgressDialog;
