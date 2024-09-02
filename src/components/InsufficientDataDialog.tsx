import {
  Button,
  Heading,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalOverlay,
  Text,
  VStack,
} from "@chakra-ui/react";
import { FormattedMessage } from "react-intl";

interface InsufficientDataDialogProps {
  onClose: () => void;
}

const InsufficientDataDialog = ({ onClose }: InsufficientDataDialogProps) => {
  return (
    <Modal
      closeOnOverlayClick={false}
      motionPreset="none"
      isOpen={true}
      onClose={onClose}
      size="2xl"
      isCentered
    >
      <ModalOverlay>
        <ModalContent p={8}>
          <ModalBody>
            <ModalCloseButton />
            <VStack width="100%" alignItems="left" gap={5}>
              <Heading as="h1" fontWeight="bold" fontSize="2xl">
                <FormattedMessage id="menu.trainer.notEnoughDataHeader1" />
              </Heading>
              <Text>
                <FormattedMessage id="menu.trainer.notEnoughDataInfoBody" />
              </Text>
            </VStack>
          </ModalBody>
          <ModalFooter justifyContent="right" px={0} pb={0}>
            <Button variant="primary" onClick={onClose}>
              <FormattedMessage id="menu.trainer.addDataButton" />
            </Button>
          </ModalFooter>
        </ModalContent>
      </ModalOverlay>
    </Modal>
  );
};

export default InsufficientDataDialog;
