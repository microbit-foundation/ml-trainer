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
import { ComponentProps } from "react";
import { FormattedMessage } from "react-intl";

const TrainModelInsufficientDataDialog = ({
  onClose,
  ...rest
}: Omit<ComponentProps<typeof Modal>, "children">) => {
  return (
    <Modal
      closeOnOverlayClick={false}
      motionPreset="none"
      size="2xl"
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
                <FormattedMessage id="insufficient-data-title" />
              </Heading>
              <VStack gap={5} align="stretch">
                <Text textAlign="left">
                  <FormattedMessage id="insufficient-data-body" />
                </Text>
              </VStack>
            </VStack>
          </ModalBody>
          <ModalFooter justifyContent="flex-end" px={0} pb={0}>
            <Button variant="primary" onClick={onClose}>
              <FormattedMessage id="close-action" />
            </Button>
          </ModalFooter>
        </ModalContent>
      </ModalOverlay>
    </Modal>
  );
};

export default TrainModelInsufficientDataDialog;
