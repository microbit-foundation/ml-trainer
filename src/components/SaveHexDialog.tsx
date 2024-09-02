import {
  Heading,
  Modal,
  ModalBody,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Progress,
  Stack,
  Text,
  VStack,
} from "@chakra-ui/react";
import { FormattedMessage } from "react-intl";

interface SaveHexDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const SaveHexDialog = ({ isOpen, onClose }: SaveHexDialogProps) => {
  return (
    <Modal
      size="xl"
      isOpen={isOpen}
      onClose={onClose}
      closeOnOverlayClick={false}
      closeOnEsc={false}
      isCentered
    >
      <ModalOverlay>
        <ModalContent p={5}>
          <ModalHeader>
            <Heading as="h2" fontSize="xl" fontWeight="bold">
              <FormattedMessage id="save-hex-dialog-heading" />
            </Heading>
          </ModalHeader>
          <ModalBody>
            <Stack gap={5}>
              <VStack gap={3}>
                <Text>
                  <FormattedMessage id="save-hex-dialog-message1" />
                </Text>
                <Text>
                  <FormattedMessage id="save-hex-dialog-message2" />
                </Text>
                <Text>
                  <FormattedMessage id="save-hex-dialog-message3" />
                </Text>
              </VStack>
              <Progress colorScheme="green" isIndeterminate rounded="md" />
            </Stack>
          </ModalBody>
        </ModalContent>
      </ModalOverlay>
    </Modal>
  );
};

export default SaveHexDialog;
