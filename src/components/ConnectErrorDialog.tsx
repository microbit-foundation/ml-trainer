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
import ExternalLink from "./ExternalLink";
import { useDeployment } from "../deployment";

export type ConnectionErrorVariant =
  | "connectionLost"
  | "connectFailed"
  | "reconnectFailed";

export type ConnectionErrorDeviceType = "bluetooth" | "bridge" | "remote";

interface ConnectErrorDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onRetry: () => void;
  variant: ConnectionErrorVariant;
  deviceType: ConnectionErrorDeviceType;
}

const variantToTextPrefix: Record<ConnectionErrorVariant, string> = {
  connectionLost: "disconnected-warning",
  connectFailed: "connect-failed",
  reconnectFailed: "reconnect-failed",
};

const getRecoveryStepsConfig = (deviceType: ConnectionErrorDeviceType) => {
  // USB (bridge) disconnect shows USB replug steps
  if (deviceType === "bridge") {
    return {
      listHeading: "webusb-retry-replug2",
      bullets: ["webusb-retry-replug3", "webusb-retry-replug4"],
    };
  }
  // Bluetooth and remote disconnects show bluetooth recovery steps
  return {
    listHeading: "disconnected-warning-bluetooth2",
    bullets: [
      "disconnected-warning-bluetooth3",
      "disconnected-warning-bluetooth4",
    ],
  };
};

const ConnectErrorDialog = ({
  isOpen,
  onClose,
  onRetry,
  variant,
  deviceType,
}: ConnectErrorDialogProps) => {
  const { supportLinks } = useDeployment();
  const textPrefix = variantToTextPrefix[variant];
  const recoverySteps = getRecoveryStepsConfig(deviceType);
  const retryButtonTextId =
    variant === "connectFailed" ? "connect-action" : "reconnect-action";

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
            <FormattedMessage id={`${textPrefix}-${deviceType}-heading`} />
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack width="100%" alignItems="left" gap={5}>
              <VStack gap={3} textAlign="left" w="100%">
                <Text w="100%">
                  <FormattedMessage id={`${textPrefix}-${deviceType}1`} />
                </Text>
                <Text w="100%">
                  <FormattedMessage id={recoverySteps.listHeading} />
                </Text>
                <UnorderedList textAlign="left" w="100%" ml={20}>
                  {recoverySteps.bullets.map((textId) => (
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
              <Button onClick={onRetry} variant="primary" size="lg">
                <FormattedMessage id={retryButtonTextId} />
              </Button>
            </HStack>
          </ModalFooter>
        </ModalContent>
      </ModalOverlay>
    </Modal>
  );
};

export default ConnectErrorDialog;
