import {
  Button,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  ModalProps,
  Text,
} from "@chakra-ui/react";
import { FormattedMessage } from "react-intl";

const NotMakeCodeHexImportErrorDialog = ({
  onClose,
  ...props
}: Omit<ModalProps, "children">) => {
  return (
    <Modal
      closeOnOverlayClick={false}
      motionPreset="none"
      size="md"
      isCentered
      onClose={onClose}
      {...props}
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
            <Button variant="primary" onClick={onClose}>
              <FormattedMessage id="close-action" />
            </Button>
          </ModalFooter>
        </ModalContent>
      </ModalOverlay>
    </Modal>
  );
};

export default NotMakeCodeHexImportErrorDialog;
