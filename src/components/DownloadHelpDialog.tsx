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

export interface DownloadHelpDialogProps
  extends Omit<ComponentProps<typeof Modal>, "children"> {
  onNext: (isSkipNextTime: boolean) => void;
}

const DownloadHelpDialog = ({
  onClose,
  onNext,
  ...rest
}: DownloadHelpDialogProps) => {
  const { appNameFull } = useDeployment();
  const [isSkipNextTime, setSkipNextTime] = useState<boolean>(false);
  const handleOnNext = useCallback(() => {
    onNext(isSkipNextTime);
  }, [onNext, isSkipNextTime]);
  return (
    <Modal
      isDismissable={false}
      motionless
      onClose={onClose}
      size={{ base: "full", md: "xl" }}
      isCentered
      {...rest}
    >
      <ModalHeader>
        <FormattedMessage id="download-project-intro-title" />
      </ModalHeader>
      <ModalCloseButton />
      <ModalBody>
        <Text>
          <FormattedMessage
            id="download-project-intro-description"
            values={{ appNameFull }}
          />
        </Text>
      </ModalBody>
      <ModalFooter>
        <ModalFooterContent
          leftContent={
            <Checkbox isSelected={isSkipNextTime} onChange={setSkipNextTime}>
              <FormattedMessage id="dont-show-again" />
            </Checkbox>
          }
        >
          <Button variant="secondary" onPress={onClose} size="lg">
            <FormattedMessage id="cancel-action" />
          </Button>
          <Button variant="primary" onPress={handleOnNext} size="lg">
            <FormattedMessage id="next-action" />
          </Button>
        </ModalFooterContent>
      </ModalFooter>
    </Modal>
  );
};

export default DownloadHelpDialog;
