import {
  Button,
  HStack,
  ListItem,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Text,
  UnorderedList,
  VStack,
} from "@chakra-ui/react";
import { FormattedMessage } from "react-intl";
import { ConnectionFlowStep } from "../connection-stage-hooks";
import { useDeployment } from "../deployment";

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
      <OneLineContent textId="webusb-retry-replug1" />
      <VStack textAlign="left" w="100%">
        <OneLineContent textId="webusb-retry-replug2" />
        <UnorderedList textAlign="left" w="100%" ml={20}>
          {["webusb-retry-replug3", "webusb-retry-replug4"].map((textId) => (
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
  const { appNameShort } = useDeployment();
  return (
    <VStack>
      <Text textAlign="left" w="100%">
        <FormattedMessage id="other-tabs-body1" />
      </Text>
      <Text textAlign="left" w="100%">
        <FormattedMessage id="other-tabs-body2" values={{ appNameShort }} />
      </Text>
    </VStack>
  );
};

const configs = {
  [ConnectionFlowStep.TryAgainReplugMicrobit]: {
    headingId: "other-tabs-heading",
    children: <ReplugMicrobitContent />,
  },
  [ConnectionFlowStep.TryAgainCloseTabs]: {
    headingId: "other-tabs-heading",
    children: <CloseTabsContent />,
  },
  [ConnectionFlowStep.TryAgainWebUsbSelectMicrobit]: {
    headingId: "other-tabs-heading",
    children: <OneLineContent textId="webusb-retry-no-select" />,
  },
  [ConnectionFlowStep.TryAgainBluetoothSelectMicrobit]: {
    headingId: "connect-bluetooth-heading",
    children: (
      <OneLineContent textId="connect-bluetooth-cancelled-connection" />
    ),
  },
};

interface TryAgainDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onTryAgain: () => void;
  type:
    | ConnectionFlowStep.TryAgainReplugMicrobit
    | ConnectionFlowStep.TryAgainCloseTabs
    | ConnectionFlowStep.TryAgainWebUsbSelectMicrobit
    | ConnectionFlowStep.TryAgainBluetoothSelectMicrobit;
}

const TryAgainDialog = ({
  type,
  isOpen,
  onClose,
  onTryAgain,
}: TryAgainDialogProps) => {
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
        <ModalContent>
          <ModalHeader>
            <FormattedMessage id={config.headingId} />
          </ModalHeader>
          <ModalBody>
            <VStack width="100%" alignItems="left" gap={5}>
              <VStack gap={5} textAlign="left" w="100%">
                {config.children}
              </VStack>
            </VStack>
          </ModalBody>
          <ModalFooter justifyContent="end">
            <HStack gap={5}>
              <Button onClick={onClose} variant="secondary" size="lg">
                <FormattedMessage id="cancel-action" />
              </Button>
              <Button onClick={onTryAgain} variant="primary" size="lg">
                <FormattedMessage id="try-again-action" />
              </Button>
            </HStack>
          </ModalFooter>
        </ModalContent>
      </ModalOverlay>
    </Modal>
  );
};

export default TryAgainDialog;
