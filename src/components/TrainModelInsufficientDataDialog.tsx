import {
  Button,
  HStack,
  Image,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Text,
  VStack,
} from "@chakra-ui/react";
import { FormattedMessage } from "react-intl";
import trainModelImage from "../images/train_model_black.svg";
import { ComponentProps } from "react";

const TrainModelInsufficientDataDialog = ({
  onClose,
  ...rest
}: Omit<ComponentProps<typeof Modal>, "children">) => {
  return (
    <Modal
      closeOnOverlayClick={false}
      motionPreset="none"
      size="lg"
      isCentered
      onClose={onClose}
      {...rest}
    >
      <ModalOverlay>
        <ModalContent>
          <ModalHeader>
            <FormattedMessage id="insufficient-data-title" />
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack width="100%" alignItems="left">
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

export default TrainModelInsufficientDataDialog;
