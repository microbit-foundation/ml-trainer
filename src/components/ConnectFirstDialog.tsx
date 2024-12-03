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
import { ConnectionStatus } from "../connect-status-hooks";
import { useConnectionStage } from "../connection-stage-hooks";
import { ConnectOptions } from "../store";

interface ConnectFirstDialogProps
  extends Omit<ComponentProps<typeof Modal>, "children"> {
  explanationTextId: string;
  onChooseConnect?: () => void;
  options?: ConnectOptions;
}

const ConnectFirstDialog = ({
  explanationTextId,
  options,
  onClose,
  onChooseConnect,
  ...rest
}: ConnectFirstDialogProps) => {
  const {
    actions,
    status: connStatus,
    isDialogOpen: isConnectionDialogOpen,
  } = useConnectionStage();
  const [isWaiting, setIsWaiting] = useState<boolean>(false);

  const handleOnClose = useCallback(() => {
    setIsWaiting(false);
    onClose();
  }, [onClose]);

  const handleConnect = useCallback(async () => {
    onChooseConnect?.();
    switch (connStatus) {
      case ConnectionStatus.FailedToConnect:
      case ConnectionStatus.FailedToReconnectTwice:
      case ConnectionStatus.FailedToSelectBluetoothDevice:
      case ConnectionStatus.NotConnected: {
        // Start connection flow.
        actions.startConnect(options);
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
  }, [onChooseConnect, connStatus, actions, options, handleOnClose]);

  useEffect(() => {
    if (
      isConnectionDialogOpen ||
      (isWaiting && connStatus === ConnectionStatus.Connected)
    ) {
      // Close dialog if connection dialog is opened, or
      // once connected after waiting.
      handleOnClose();
      return;
    }
  }, [connStatus, handleOnClose, isConnectionDialogOpen, isWaiting, onClose]);

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
              <FormattedMessage id={explanationTextId} />
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

export default ConnectFirstDialog;
