import {
  Button,
  Checkbox,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Text,
} from "@chakra-ui/react";
import { ComponentProps, useCallback, useState } from "react";
import { FormattedMessage } from "react-intl";
import { useDeployment } from "../deployment";

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
      size="xl"
      isCentered
      {...props}
    >
      <ModalOverlay>
        <ModalContent>
          <ModalHeader>
            <FormattedMessage id="train-header" />
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Text>
              <FormattedMessage
                id="train-description"
                values={{ appNameFull }}
              />
            </Text>
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
