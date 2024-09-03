import {
  Image,
  HStack,
  Text,
  VStack,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalBody,
  ModalCloseButton,
  Heading,
  ModalFooter,
  Button,
} from "@chakra-ui/react";
import testModelImage from "../images/test_model_black.svg";
import { FormattedMessage } from "react-intl";

export interface DownloadProjectIntroDialogProps {
  onClose: () => void;
  onNext: () => void;
}

const DownloadProjectIntroDialog = ({
  onClose,
  onNext,
}: DownloadProjectIntroDialogProps) => {
  return (
    <Modal
      closeOnOverlayClick={false}
      motionPreset="none"
      isOpen={true}
      onClose={onClose}
      size="3xl"
      isCentered
    >
      <ModalOverlay>
        <ModalContent p={8}>
          <ModalBody>
            <ModalCloseButton />
            <VStack width="100%" alignItems="left" gap={5}>
              <Heading as="h1" fontWeight="bold" fontSize="2xl">
                <FormattedMessage id="download-project-intro-title" />
              </Heading>
              <HStack gap={5}>
                <Image src={testModelImage} opacity={0.4} w="180px" alt="" />
                <VStack gap={5}>
                  <Text textAlign="left">
                    <FormattedMessage id="download-project-intro-description" />
                  </Text>
                </VStack>
              </HStack>
            </VStack>
          </ModalBody>
          <ModalFooter justifyContent="right" px={0} pb={0}>
            <Button variant="primary" onClick={onNext}>
              <FormattedMessage id="download-action" />
            </Button>
          </ModalFooter>
        </ModalContent>
      </ModalOverlay>
    </Modal>
  );
};

export default DownloadProjectIntroDialog;
