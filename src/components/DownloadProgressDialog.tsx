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
      return "connectMB.usbDownloading.header";
    case ConnectionFlowType.ConnectRadioRemote:
      return "connectMB.usbDownloadingMB1.header";
    case ConnectionFlowType.ConnectRadioBridge:
      return "connectMB.usbDownloadingMB2.header";
  }
};

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
      onClose={() => {}}
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
                <FormattedMessage id="connectMB.usbDownloading.subtitle" />
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
