import {
  Button,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Text,
} from "@chakra-ui/react";
import { useCallback } from "react";
import { FormattedMessage } from "react-intl";
import { useStore } from "../store";

const NotCreateAiHexImportDialog = () => {
  const setIsNotCreateAiHexDialogOpen = useStore(
    (s) => s.setIsNotCreateAHexiDialogOpen
  );
  const handleClose = useCallback(() => {
    setIsNotCreateAiHexDialogOpen(false);
  }, [setIsNotCreateAiHexDialogOpen]);
  return (
    <Modal
      isOpen
      closeOnOverlayClick={false}
      motionPreset="none"
      size="md"
      isCentered
      onClose={handleClose}
    >
      <ModalOverlay>
        <ModalContent>
          <ModalHeader>
            <FormattedMessage id="not-create-ai-hex-import-dialog-title" />
          </ModalHeader>
          <ModalBody>
            <ModalCloseButton />
            <Text>
              <FormattedMessage id="not-create-ai-hex-import-dialog-content" />
            </Text>
          </ModalBody>
          <ModalFooter justifyContent="flex-end">
            <Button variant="primary" onClick={handleClose}>
              <FormattedMessage id="close-action" />
            </Button>
          </ModalFooter>
        </ModalContent>
      </ModalOverlay>
    </Modal>
  );
};

export default NotCreateAiHexImportDialog;
