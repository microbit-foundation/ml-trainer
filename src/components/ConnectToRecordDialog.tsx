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
import { ComponentProps, useCallback } from "react";
import { FormattedMessage } from "react-intl";
import { useConnectionStage } from "../connection-stage-hooks";

const ConnectToRecordDialog = ({
  onClose,
  ...rest
}: Omit<ComponentProps<typeof Modal>, "children">) => {
  const { actions } = useConnectionStage();

  const handleConnect = useCallback(() => {
    onClose();
    actions.startConnect();
  }, [actions, onClose]);

  return (
    <Modal
      closeOnOverlayClick={false}
      motionPreset="none"
      size="md"
      isCentered
      onClose={onClose}
      {...rest}
    >
      <ModalOverlay>
        <ModalContent>
          <ModalHeader>
            <FormattedMessage id="connect-to-record-title" />
          </ModalHeader>
          <ModalBody>
            <ModalCloseButton />
            <Text>
              <FormattedMessage id="connect-to-record-body" />
            </Text>
          </ModalBody>
          <ModalFooter justifyContent="flex-end">
            <Button variant="primary" onClick={handleConnect}>
              <FormattedMessage id="footer.connectButton" />
            </Button>
          </ModalFooter>
        </ModalContent>
      </ModalOverlay>
    </Modal>
  );
};

export default ConnectToRecordDialog;
