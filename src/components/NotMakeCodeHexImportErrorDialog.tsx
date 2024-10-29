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

const NotMakeCodeHexImportErrorDialog = () => {
  const setIsNotMakeCodeHexDialogOpen = useStore(
    (s) => s.setIsNotMakeCodeHexDialogOpen
  );
  const handleClose = useCallback(() => {
    setIsNotMakeCodeHexDialogOpen(false);
  }, [setIsNotMakeCodeHexDialogOpen]);
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
            <FormattedMessage id="not-makecode-hex-import-error-dialog-title" />
          </ModalHeader>
          <ModalBody>
            <ModalCloseButton />
            <Text>
              <FormattedMessage id="not-makecode-hex-import-error-dialog-content" />
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

export default NotMakeCodeHexImportErrorDialog;
