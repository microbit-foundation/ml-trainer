import {
  Button,
  Checkbox,
  HStack,
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
      closeOnOverlayClick={false}
      motionPreset="none"
      onClose={onClose}
      size="xl"
      isCentered
      {...rest}
    >
      <ModalOverlay>
        <ModalContent>
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
          <ModalFooter justifyContent="space-between">
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
