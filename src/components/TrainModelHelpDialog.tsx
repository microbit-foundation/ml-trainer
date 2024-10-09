import {
  Button,
  Checkbox,
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
import { ComponentProps, useCallback, useState } from "react";
import { FormattedMessage } from "react-intl";
import { useDeployment } from "../deployment";
import trainModelImage from "../images/train_model_black.svg";

interface TrainModelHelpDialogProps
  extends Omit<ComponentProps<typeof Modal>, "children"> {
  onNext: (isSkipNextTime: boolean) => void;
}

const TrainModelIntroDialog = ({
  onNext,
  ...props
}: TrainModelHelpDialogProps) => {
  const { appNameFull } = useDeployment();
  const [skip, setSkip] = useState<boolean>(false);
  const handleNext = useCallback(() => onNext(skip), [onNext, skip]);

  return (
    <Modal
      closeOnOverlayClick={false}
      motionPreset="none"
      size="2xl"
      isCentered
      {...props}
    >
      <ModalOverlay>
        <ModalContent>
          <ModalHeader>
            <FormattedMessage id="content.trainer.header" />
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <HStack gap={5} width="100%" alignItems="left">
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
                  <FormattedMessage
                    id="content.trainer.description"
                    values={{ appNameFull }}
                  />
                </Text>
              </VStack>
            </HStack>
          </ModalBody>
          <ModalFooter justifyContent="space-between">
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
