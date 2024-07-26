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

interface ReconnectErrorDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onReconnect: () => void;
  flowType: ConnectionFlowType;
  errorStep:
    | ConnectionFlowStep.ReconnectFailed
    | ConnectionFlowStep.ConnectionLost;
}

const contentConfig = {
  bluetooth: {
    listHeading: "disconnectedWarning.bluetooth2",
    bullets: [
      "disconnectedWarning.bluetooth3",
      "disconnectedWarning.bluetooth4",
    ],
  },
  bridge: {
    listHeading: "connectMB.usbTryAgain.replugMicrobit2",
    bullets: [
      "connectMB.usbTryAgain.replugMicrobit3",
      "connectMB.usbTryAgain.replugMicrobit4",
    ],
  },
  remote: {
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
};

const ReconnectErrorDialog = ({
  isOpen,
  onClose,
  onReconnect,
  flowType,
  errorStep,
}: ReconnectErrorDialogProps) => {
  const errorTextIdPrefix = errorTextIdPrefixConfig[errorStep];
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
                  id={`${errorTextIdPrefix}.${flowType}Heading`}
                />
              </Heading>
              <VStack gap={3} textAlign="left" w="100%">
                <Text w="100%">
                  <FormattedMessage id={`${errorTextIdPrefix}.${flowType}1`} />
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
              <Button onClick={onReconnect} variant="primary" size="lg">
                <FormattedMessage id="actions.reconnect" />
              </Button>
            </HStack>
          </ModalFooter>
        </ModalContent>
      </ModalOverlay>
    </Modal>
  );
};

export default ReconnectErrorDialog;
