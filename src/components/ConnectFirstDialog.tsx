/**
 * (c) 2024, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import {
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
import { ButtonWithLoading } from "./ButtonWithLoading";

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
  isOpen,
  ...rest
}: ConnectFirstDialogProps) => {
  const { handleClose, isConnecting, handleConnect } = useConnectFirst({
    isOpen,
    onClose,
    onConnect: onChooseConnect,
    connectOptions: options,
  });
  return (
    <Modal
      closeOnOverlayClick={false}
      motionPreset="none"
      size="md"
      isCentered
      onClose={handleClose}
      isOpen={isOpen}
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
            <ButtonWithLoading
              variant="primary"
              onClick={handleConnect}
              isLoading={isConnecting}
            >
              <FormattedMessage id="connect-action" />
            </ButtonWithLoading>
          </ModalFooter>
        </ModalContent>
      </ModalOverlay>
    </Modal>
  );
};

export const useConnectFirst = ({
  isOpen,
  onClose,
  onConnect,
  connectOptions,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConnect?: () => void;
  connectOptions?: ConnectOptions;
}) => {
  const {
    actions,
    status: connStatus,
    isDialogOpen: isConnectionDialogOpen,
  } = useConnectionStage();
  const [isConnecting, setIsConnecting] = useState<boolean>(false);

  const handleClose = useCallback(() => {
    setIsConnecting(false);
    onClose();
  }, [onClose]);

  const handleConnect = useCallback(async () => {
    onConnect?.();
    switch (connStatus) {
      case ConnectionStatus.FailedToConnect:
      case ConnectionStatus.FailedToReconnectTwice:
      case ConnectionStatus.FailedToSelectBluetoothDevice:
      case ConnectionStatus.NotConnected: {
        // Start connection flow.
        actions.startConnect(connectOptions);
        return handleClose();
      }
      case ConnectionStatus.ConnectionLost:
      case ConnectionStatus.FailedToReconnect:
      case ConnectionStatus.Disconnected: {
        // Reconnect.
        await actions.reconnect();
        return handleClose();
      }
      case ConnectionStatus.ReconnectingAutomatically: {
        // Wait for reconnection to happen.
        setIsConnecting(true);
        return;
      }
      case ConnectionStatus.Connected: {
        // Connected whilst dialog is up.
        return handleClose();
      }
      case ConnectionStatus.ReconnectingExplicitly:
      case ConnectionStatus.Connecting: {
        // Impossible cases.
        return handleClose();
      }
    }
  }, [onConnect, connStatus, actions, connectOptions, handleClose]);

  useEffect(() => {
    if (
      isOpen &&
      (isConnectionDialogOpen ||
        (isConnecting && connStatus === ConnectionStatus.Connected))
    ) {
      // Close dialog if connection dialog is opened, or
      // once connected after waiting.
      handleClose();
      return;
    }
  }, [
    connStatus,
    handleClose,
    isConnectionDialogOpen,
    isOpen,
    isConnecting,
    onClose,
  ]);

  return { handleConnect, isConnecting, handleClose };
};

export default ConnectFirstDialog;
