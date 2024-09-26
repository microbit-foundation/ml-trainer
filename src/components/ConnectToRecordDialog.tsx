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
      size="xl"
      isCentered
      onClose={onClose}
      {...rest}
    >
      <ModalOverlay>
        <ModalContent p={8}>
          <ModalBody>
            <ModalCloseButton />
            <VStack width="100%" alignItems="left" gap={5}>
              <Heading as="h1" fontWeight="bold" fontSize="2xl">
                <FormattedMessage id="connect-to-record-title" />
              </Heading>
              <VStack gap={5}>
                <Text textAlign="left" w="full">
                  <FormattedMessage id="connect-to-record-body" />
                </Text>
              </VStack>
            </VStack>
          </ModalBody>
          <ModalFooter justifyContent="flex-end" px={0} pb={0}>
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
