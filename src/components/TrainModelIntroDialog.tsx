import {
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
import { FormattedMessage } from "react-intl";
import trainModelImage from "../images/train_model_black.svg";
import { useTrainModelDialogs } from "../ml-status-hooks";
import TrainingButton from "./TrainingButton";
import { useCallback, useState } from "react";

interface TrainModelIntroDialogProps {
  onNext: (isSkipIntro: boolean) => void;
}

const TrainModelIntroDialog = ({ onNext }: TrainModelIntroDialogProps) => {
  const { onClose, isSkipIntro: defaultIsSkipIntro } = useTrainModelDialogs();
  const [skip, setSkip] = useState<boolean>(defaultIsSkipIntro);
  const handleOnNext = useCallback(() => onNext(skip), [onNext, skip]);

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
                <Image src={trainModelImage} opacity={0.4} w="180px" alt="" />
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
              Don't show this again
            </Checkbox>
            <TrainingButton onClick={handleOnNext} />
          </ModalFooter>
        </ModalContent>
      </ModalOverlay>
    </Modal>
  );
};

export default TrainModelIntroDialog;
