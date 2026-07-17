/**
 * (c) 2024, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import {
  Button,
  Checkbox,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalFooter,
  ModalHeader,
  Text,
} from "@microbit/ui";
import { ComponentProps, useCallback, useState } from "react";
import { FormattedMessage } from "react-intl";
import { useDeployment } from "../deployment";
import ModalFooterContent from "./ModalFooterContent";

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
    <Modal isDismissable={false} motionless size="xl" isCentered {...props}>
      <ModalHeader>
        <FormattedMessage id="train-header" />
      </ModalHeader>
      <ModalCloseButton />
      <ModalBody>
        <Text>
          <FormattedMessage id="train-description" values={{ appNameFull }} />
        </Text>
      </ModalBody>
      <ModalFooter>
        <ModalFooterContent
          leftContent={
            <Checkbox isSelected={skip} onChange={setSkip}>
              <FormattedMessage id="dont-show-again" />
            </Checkbox>
          }
        >
          <Button onPress={handleNext} variant="primary">
            <FormattedMessage id="start-training-action" />
          </Button>
        </ModalFooterContent>
      </ModalFooter>
    </Modal>
  );
};

export default TrainModelIntroDialog;
