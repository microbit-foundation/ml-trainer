import {
  Button,
  HStack,
  Heading,
  ListItem,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalOverlay,
  Text,
  UnorderedList,
  VStack,
} from "@chakra-ui/react";
import { FormattedMessage } from "react-intl";
import {
  ConnectionFlowStep,
  ConnectionFlowType,
} from "../connection-stage-hooks";
import ExternalLink from "./ExternalLink";

interface ConnectErrorDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConnect: () => void;
  flowType: ConnectionFlowType;
  errorStep:
    | ConnectionFlowStep.ConnectFailed
    | ConnectionFlowStep.ReconnectFailed
    | ConnectionFlowStep.ConnectionLost;
}

const contentConfig = {
  [ConnectionFlowType.ConnectBluetooth]: {
    listHeading: "disconnectedWarning.bluetooth2",
    bullets: [
      "disconnectedWarning.bluetooth3",
      "disconnectedWarning.bluetooth4",
    ],
  },
  [ConnectionFlowType.ConnectRadioBridge]: {
    listHeading: "connectMB.usbTryAgain.replugMicrobit2",
    bullets: [
      "connectMB.usbTryAgain.replugMicrobit3",
      "connectMB.usbTryAgain.replugMicrobit4",
    ],
  },
  [ConnectionFlowType.ConnectRadioRemote]: {
    listHeading: "disconnectedWarning.bluetooth2",
    bullets: [
      "disconnectedWarning.bluetooth3",
      "disconnectedWarning.bluetooth4",
    ],
  },
};

const errorTextIdPrefixConfig = {
  [ConnectionFlowStep.ConnectionLost]: "disconnectedWarning",
  [ConnectionFlowStep.ReconnectFailed]: "reconnectFailed",
  [ConnectionFlowStep.ConnectFailed]: "connectFailed",
};

const ReconnectErrorDialog = ({
  isOpen,
  onClose,
  onConnect,
  flowType,
  errorStep,
}: ConnectErrorDialogProps) => {
  const errorTextIdPrefix = errorTextIdPrefixConfig[errorStep];
  const flowTypeText = {
    [ConnectionFlowType.ConnectBluetooth]: "bluetooth",
    [ConnectionFlowType.ConnectRadioBridge]: "bridge",
    [ConnectionFlowType.ConnectRadioRemote]: "remote",
  }[flowType];
  return (
    <Modal
      motionPreset="none"
      isOpen={isOpen}
      onClose={onClose}
      size="2xl"
      isCentered
    >
      <ModalOverlay>
        <ModalContent p={8}>
          <ModalBody px={0}>
            <ModalCloseButton />
            <VStack width="100%" alignItems="left" gap={5}>
              <Heading as="h2" fontSize="xl" fontWeight="bold">
                <FormattedMessage
                  id={`${errorTextIdPrefix}.${flowTypeText}Heading`}
                />
              </Heading>
              <VStack gap={3} textAlign="left" w="100%">
                <Text w="100%">
                  <FormattedMessage
                    id={`${errorTextIdPrefix}.${flowTypeText}1`}
                  />
                </Text>
                <Text w="100%">
                  <FormattedMessage id={contentConfig[flowType].listHeading} />
                </Text>
                <UnorderedList textAlign="left" w="100%" ml={20}>
                  {contentConfig[flowType].bullets.map((textId) => (
                    <ListItem key={textId}>
                      <Text>
                        <FormattedMessage id={textId} />
                      </Text>
                    </ListItem>
                  ))}
                </UnorderedList>
              </VStack>
            </VStack>
          </ModalBody>
          <ModalFooter justifyContent="space-between" px={0} pb={0}>
            <ExternalLink
              textId="connectMB.troubleshooting"
              href="https://support.microbit.org/a/solutions/articles/19000157495"
            />
            <HStack gap={5}>
              <Button onClick={onClose} variant="secondary" size="lg">
                <FormattedMessage id="cancel-action" />
              </Button>
              <Button onClick={onConnect} variant="primary" size="lg">
                <FormattedMessage
                  id={
                    errorStep === ConnectionFlowStep.ConnectFailed
                      ? "footer.connectButton"
                      : "actions.reconnect"
                  }
                />
              </Button>
            </HStack>
          </ModalFooter>
        </ModalContent>
      </ModalOverlay>
    </Modal>
  );
};

export default ReconnectErrorDialog;
