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
import trainModelImage from "../images/train_model_black.svg";

interface TrainModelIntroDialogProps {
  onNext: (isSkipNextTime: boolean) => void;
  onClose: () => void;
}

const TrainModelIntroDialog = ({
  onClose,
  onNext,
}: TrainModelIntroDialogProps) => {
  const [skip, setSkip] = useState<boolean>(false);
  const handleNext = useCallback(() => onNext(skip), [onNext, skip]);

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
                <FormattedMessage id="content.trainer.header" />
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
                    <FormattedMessage id="content.trainer.description" />
                  </Text>
                </VStack>
              </HStack>
            </VStack>
          </ModalBody>
          <ModalFooter justifyContent="space-between" px={0} pb={0}>
            <Checkbox
              isChecked={skip}
              onChange={(e) => setSkip(e.target.checked)}
            >
              <FormattedMessage id="dont-show-again" />
            </Checkbox>
            <Button onClick={handleNext} variant="primary">
              <FormattedMessage id="start-training-action" />
            </Button>
          </ModalFooter>
        </ModalContent>
      </ModalOverlay>
    </Modal>
  );
};

export default TrainModelIntroDialog;
