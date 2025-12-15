/**
 * (c) 2024, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import {
  Button,
  HStack,
  ListItem,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
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
import { useDeployment } from "../deployment";

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

const getContentConfig = (flowType: ConnectionFlowType) => {
  if (flowType === ConnectionFlowType.ConnectRadioBridge) {
    return {
      listHeading: "webusb-retry-replug2",
      bullets: ["webusb-retry-replug3", "webusb-retry-replug4"],
    };
  }
  return {
    listHeading: "disconnected-warning-bluetooth2",
    bullets: [
      "disconnected-warning-bluetooth3",
      "disconnected-warning-bluetooth4",
    ],
  };
};

const errorTextIdPrefixConfig = {
  [ConnectionFlowStep.ConnectionLost]: "disconnected-warning",
  [ConnectionFlowStep.ReconnectFailed]: "reconnect-failed",
  [ConnectionFlowStep.ConnectFailed]: "connect-failed",
};

const ReconnectErrorDialog = ({
  isOpen,
  onClose,
  onConnect,
  flowType,
  errorStep,
}: ConnectErrorDialogProps) => {
  const { supportLinks } = useDeployment();
  const errorTextIdPrefix = errorTextIdPrefixConfig[errorStep];
  const contentConfig = getContentConfig(flowType);
  const flowTypeText = {
    [ConnectionFlowType.ConnectNativeBluetooth]: "bluetooth",
    [ConnectionFlowType.ConnectWebBluetooth]: "bluetooth",
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
        <ModalContent>
          <ModalHeader>
            <FormattedMessage
              id={`${errorTextIdPrefix}-${flowTypeText}-heading`}
            />
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack width="100%" alignItems="left" gap={5}>
              <VStack gap={3} textAlign="left" w="100%">
                <Text w="100%">
                  <FormattedMessage
                    id={`${errorTextIdPrefix}-${flowTypeText}1`}
                  />
                </Text>
                <Text w="100%">
                  <FormattedMessage id={contentConfig.listHeading} />
                </Text>
                <UnorderedList textAlign="left" w="100%" ml={20}>
                  {contentConfig.bullets.map((textId) => (
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
          <ModalFooter justifyContent="space-between">
            <ExternalLink
              textId="connect-troubleshooting"
              href={supportLinks.troubleshooting}
            />
            <HStack gap={5}>
              <Button onClick={onClose} variant="secondary" size="lg">
                <FormattedMessage id="cancel-action" />
              </Button>
              <Button onClick={onConnect} variant="primary" size="lg">
                <FormattedMessage
                  id={
                    errorStep === ConnectionFlowStep.ConnectFailed
                      ? "connect-action"
                      : "reconnect-action"
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
