import {
  Button,
  Checkbox,
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
import { useCallback, useState } from "react";
import { FormattedMessage } from "react-intl";
import { DownloadProjectStage } from "../download-project-hooks";
import testModelImage from "../images/test_model_black.svg";

export interface DownloadProjectIntroDialogProps {
  onClose: () => void;
  onNext: (stage: Partial<DownloadProjectStage>) => void;
}

const DownloadProjectIntroDialog = ({
  onClose,
  onNext,
}: DownloadProjectIntroDialogProps) => {
  const [skipIntro, setSkipIntro] = useState<boolean>(false);
  const handleOnNext = useCallback(() => {
    onNext({ skipIntro });
  }, [onNext, skipIntro]);
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
          <ModalFooter justifyContent="space-between" px={0} pb={0}>
            <Checkbox
              isChecked={skipIntro}
              onChange={(e) => setSkipIntro(e.target.checked)}
            >
              <FormattedMessage id="dont-show-again" />
            </Checkbox>
            <Button variant="primary" onClick={handleOnNext}>
              <FormattedMessage id="download-action" />
            </Button>
          </ModalFooter>
        </ModalContent>
      </ModalOverlay>
    </Modal>
  );
};

export default DownloadProjectIntroDialog;
