import {
  Button,
  Heading,
  HStack,
  Image,
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
import trainModelImage from "../images/train_model_black.svg";

export interface InsufficientDataDialogProps {
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
                <FormattedMessage id="insufficient-data-title" />
              </Heading>
              <HStack gap={5}>
                <Image
                  src={trainModelImage}
                  opacity={0.4}
                  w="180px"
                  h="107px"
                  alt=""
                  flexShrink={0}
                />
                <VStack gap={5}>
                  <Text textAlign="left">
                    <FormattedMessage id="insufficient-data-body" />
                  </Text>
                </VStack>
              </HStack>
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

export default InsufficientDataDialog;
