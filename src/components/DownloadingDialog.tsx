import {
  Heading,
  Modal,
  ModalBody,
  ModalContent,
  ModalOverlay,
  Progress,
  Text,
  VStack,
} from "@chakra-ui/react";
import { FormattedMessage } from "react-intl";
import { ConnectionFlowType } from "../connection-stage-hooks";

export interface DownloadingDialogProps {
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

const DownloadingDialog = ({
  isOpen,
  headingId,
  progress,
}: DownloadingDialogProps) => {
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
        <ModalContent p={8}>
          <ModalBody>
            <VStack width="100%" alignItems="left" gap={5}>
              <Heading as="h1" fontWeight="bold" fontSize="2xl">
                <FormattedMessage id={headingId} />
              </Heading>
              <Text>
                <FormattedMessage id="connectMB.usbDownloading.subtitle" />
              </Text>
              <Progress
                value={progress}
                colorScheme="green"
                size="md"
                rounded={100}
              />
            </VStack>
          </ModalBody>
        </ModalContent>
      </ModalOverlay>
    </Modal>
  );
};

export default DownloadingDialog;
