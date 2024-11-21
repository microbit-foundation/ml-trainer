import {
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Progress,
  Text,
  VStack,
} from "@chakra-ui/react";
import { FormattedMessage } from "react-intl";
import { ConnectionFlowType } from "../connection-stage-hooks";

export interface DownloadProgressDialogProps {
  isOpen: boolean;
  headingId: string;
  progress: number;
}

export const getHeadingId = (flowType: ConnectionFlowType) => {
  switch (flowType) {
    case ConnectionFlowType.ConnectBluetooth:
      return "downloading-data-collection-header";
    case ConnectionFlowType.ConnectRadioRemote:
      return "downloading-data-collection-header";
    case ConnectionFlowType.ConnectRadioBridge:
      return "downloading-radio-link-header";
  }
};

const noop = () => {};

const DownloadProgressDialog = ({
  isOpen,
  headingId,
  progress,
}: DownloadProgressDialogProps) => {
  return (
    <Modal
      closeOnOverlayClick={false}
      motionPreset="none"
      isOpen={isOpen}
      onClose={noop}
      size="3xl"
      isCentered
    >
      <ModalOverlay>
        <ModalContent>
          <ModalHeader>
            <FormattedMessage id={headingId} />
          </ModalHeader>
          <ModalBody>
            <VStack width="100%" alignItems="left" gap={5}>
              <Text>
                <FormattedMessage id="downloading-subtitle" />
              </Text>
              <Progress
                value={progress}
                colorScheme="brand2"
                size="md"
                rounded={100}
              />
            </VStack>
          </ModalBody>
          <ModalFooter />
        </ModalContent>
      </ModalOverlay>
    </Modal>
  );
};

export default DownloadProgressDialog;
