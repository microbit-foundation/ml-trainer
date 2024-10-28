import {
  Button,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Text,
} from "@chakra-ui/react";
import { ComponentProps, useCallback, useEffect, useState } from "react";
import { FormattedMessage } from "react-intl";
import {
  ConnectionFlowStep,
  useConnectionStage,
} from "../connection-stage-hooks";
import { ConnectionStatus } from "../connect-status-hooks";

const ConnectToRecordDialog = ({
  onClose,
  ...rest
}: Omit<ComponentProps<typeof Modal>, "children">) => {
  const {
    actions,
    status: connStatus,
    stage: connStage,
  } = useConnectionStage();
  const [isWaiting, setIsWaiting] = useState<boolean>(false);

  const handleOnClose = useCallback(() => {
    setIsWaiting(false);
    onClose();
  }, [onClose]);

  const handleConnect = useCallback(async () => {
    switch (connStatus) {
      case ConnectionStatus.FailedToConnect:
      case ConnectionStatus.FailedToReconnectTwice:
      case ConnectionStatus.FailedToSelectBluetoothDevice:
      case ConnectionStatus.NotConnected: {
        // Start connection flow.
        actions.startConnect();
        return handleOnClose();
      }
      case ConnectionStatus.ConnectionLost:
      case ConnectionStatus.FailedToReconnect:
      case ConnectionStatus.Disconnected: {
        // Reconnect.
        await actions.reconnect();
        return handleOnClose();
      }
      case ConnectionStatus.ReconnectingAutomatically: {
        // Wait for reconnection to happen.
        setIsWaiting(true);
        return;
      }
      case ConnectionStatus.Connected: {
        // Connected whilst dialog is up.
        return handleOnClose();
      }
      case ConnectionStatus.ReconnectingExplicitly:
      case ConnectionStatus.Connecting: {
        // Impossible cases.
        return handleOnClose();
      }
    }
  }, [connStatus, actions, handleOnClose]);

  useEffect(() => {
    if (
      connStage.flowStep !== ConnectionFlowStep.None ||
      (isWaiting && connStatus === ConnectionStatus.Connected)
    ) {
      // Close dialog if connection dialog is opened, or
      // once connected after waiting.
      handleOnClose();
      return;
    }
  }, [connStage.flowStep, connStatus, handleOnClose, isWaiting, onClose]);

  return (
    <Modal
      closeOnOverlayClick={false}
      motionPreset="none"
      size="md"
      isCentered
      onClose={handleOnClose}
      {...rest}
    >
      <ModalOverlay>
        <ModalContent>
          <ModalHeader>
            <FormattedMessage id="microbit-not-connected" />
          </ModalHeader>
          <ModalBody>
            <ModalCloseButton />
            <Text>
              <FormattedMessage id="connect-to-record-body" />
            </Text>
          </ModalBody>
          <ModalFooter justifyContent="flex-end">
            <Button
              variant="primary"
              onClick={handleConnect}
              isLoading={isWaiting}
            >
              <FormattedMessage id="connect-action" />
            </Button>
          </ModalFooter>
        </ModalContent>
      </ModalOverlay>
    </Modal>
  );
};

export default ConnectToRecordDialog;
