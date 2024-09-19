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
import { ComponentProps, useCallback, useState } from "react";
import { FormattedMessage } from "react-intl";
import testModelImage from "../images/test_model_black.svg";

export interface DownloadHelpDialogProps
  extends Omit<ComponentProps<typeof Modal>, "children"> {
  onNext: (isSkipNextTime: boolean) => void;
}

const DownloadHelpDialog = ({
  onClose,
  onNext,
  ...rest
}: DownloadHelpDialogProps) => {
  const [isSkipNextTime, setSkipNextTime] = useState<boolean>(false);
  const handleOnNext = useCallback(() => {
    onNext(isSkipNextTime);
  }, [onNext, isSkipNextTime]);
  return (
    <Modal
      closeOnOverlayClick={false}
      motionPreset="none"
      onClose={onClose}
      size="3xl"
      isCentered
      {...rest}
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
              isChecked={isSkipNextTime}
              onChange={(e) => setSkipNextTime(e.target.checked)}
            >
              <FormattedMessage id="dont-show-again" />
            </Checkbox>
            <HStack gap={5}>
              <Button variant="secondary" onClick={onClose} size="lg">
                <FormattedMessage id="cancel-action" />
              </Button>
              <Button variant="primary" onClick={handleOnNext} size="lg">
                <FormattedMessage id="connectMB.nextButton" />
              </Button>
            </HStack>
          </ModalFooter>
        </ModalContent>
      </ModalOverlay>
    </Modal>
  );
};

export default DownloadHelpDialog;
