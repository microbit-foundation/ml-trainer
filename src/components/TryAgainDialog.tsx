import {
  Button,
  HStack,
  Heading,
  ListItem,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalOverlay,
  Text,
  UnorderedList,
  VStack,
} from "@chakra-ui/react";
import { FormattedMessage } from "react-intl";
import { ConnectionFlowStep } from "../connection-stage-hooks";

const OneLineContent = ({ textId }: { textId: string }) => {
  return (
    <Text textAlign="left" w="100%">
      <FormattedMessage id={textId} />
    </Text>
  );
};

const ReplugMicrobitContent = () => {
  return (
    <>
      <OneLineContent textId="connectMB.usbTryAgain.replugMicrobit1" />
      <VStack textAlign="left" w="100%">
        <OneLineContent textId="connectMB.usbTryAgain.replugMicrobit2" />
        <UnorderedList textAlign="left" w="100%" ml={20}>
          {[
            "connectMB.usbTryAgain.replugMicrobit3",
            "connectMB.usbTryAgain.replugMicrobit4",
          ].map((textId) => (
            <ListItem key={textId}>
              <Text>
                <FormattedMessage id={textId} />
              </Text>
            </ListItem>
          ))}
        </UnorderedList>
      </VStack>
    </>
  );
};

const CloseTabsContent = () => {
  return (
    <VStack>
      <Text textAlign="left" w="100%">
        <FormattedMessage id="connectMB.usbTryAgain.closeTabs1" />
      </Text>
      <Text textAlign="left" w="100%">
        <FormattedMessage id="connectMB.usbTryAgain.closeTabs2" />
      </Text>
    </VStack>
  );
};

const configs = {
  [ConnectionFlowStep.TryAgainReplugMicrobit]: {
    headingId: "connectMB.usbTryAgain.heading",
    children: <ReplugMicrobitContent />,
  },
  [ConnectionFlowStep.TryAgainCloseTabs]: {
    headingId: "connectMB.usbTryAgain.heading",
    children: <CloseTabsContent />,
  },
  [ConnectionFlowStep.TryAgainSelectMicrobit]: {
    headingId: "connectMB.usbTryAgain.heading",
    children: <OneLineContent textId="connectMB.usbTryAgain.selectMicrobit" />,
  },
  [ConnectionFlowStep.ConnectFailed]: {
    headingId: "connectMB.bluetooth.heading",
    children: (
      <OneLineContent textId="connectMB.bluetooth.cancelledConnection" />
    ),
  },
};

interface TryAgainWebUsbDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onTryAgain: () => void;
  type:
    | ConnectionFlowStep.TryAgainReplugMicrobit
    | ConnectionFlowStep.TryAgainCloseTabs
    | ConnectionFlowStep.TryAgainSelectMicrobit
    | ConnectionFlowStep.ConnectFailed;
}

const TryAgainWebUsbDialog = ({
  type,
  isOpen,
  onClose,
  onTryAgain,
}: TryAgainWebUsbDialogProps) => {
  const config = configs[type];
  return (
    <Modal
      closeOnOverlayClick={false}
      motionPreset="none"
      isOpen={isOpen}
      onClose={onClose}
      size="3xl"
      isCentered
    >
      <ModalOverlay>
        <ModalContent p={8}>
          <ModalBody>
            <VStack width="100%" alignItems="left" gap={5}>
              <Heading as="h2" fontSize="xl" fontWeight="bold">
                <FormattedMessage id={config.headingId} />
              </Heading>
              <VStack gap={5} textAlign="left" w="100%">
                {config.children}
              </VStack>
            </VStack>
          </ModalBody>
          <ModalFooter justifyContent="end" p={0}>
            <HStack gap={5}>
              <Button onClick={onClose} variant="secondary" size="lg">
                <FormattedMessage id="cancel-action" />
              </Button>
              <Button onClick={onTryAgain} variant="primary" size="lg">
                <FormattedMessage id="connectMB.tryAgain" />
              </Button>
            </HStack>
          </ModalFooter>
        </ModalContent>
      </ModalOverlay>
    </Modal>
  );
};

export default TryAgainWebUsbDialog;
