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
import { useDataConnectionActions } from "../data-connection-flow";
import {
  DataConnectionStep,
  isDataConnectionDialogOpen,
} from "../data-connection-flow";
import { useStore } from "../store";
import { ButtonWithLoading } from "./ButtonWithLoading";

interface ConnectFirstDialogProps
  extends Omit<ComponentProps<typeof Modal>, "children"> {
  explanationTextId: string;
  onChooseConnect?: () => void;
}

const ConnectFirstDialog = ({
  explanationTextId,
  onClose,
  onChooseConnect,
  isOpen,
  ...rest
}: ConnectFirstDialogProps) => {
  const { handleClose, isConnecting, handleConnect } = useConnectFirst({
    isOpen,
    onClose,
    onConnect: onChooseConnect,
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
}: {
  isOpen: boolean;
  onClose: () => void;
  onConnect?: () => void;
}) => {
  const connActions = useDataConnectionActions();
  const dataConnection = useStore((s) => s.dataConnection);
  const isConnected = dataConnection.step === DataConnectionStep.Connected;
  const isReconnecting = dataConnection.isReconnecting;
  const isConnectionDialogOpen = isDataConnectionDialogOpen(
    dataConnection.step
  );
  const [isConnecting, setIsConnecting] = useState<boolean>(false);

  const handleClose = useCallback(() => {
    setIsConnecting(false);
    onClose();
  }, [onClose]);

  const handleConnect = useCallback(() => {
    onConnect?.();

    // Auto-reconnection in progress - show loading and wait for it
    if (isReconnecting) {
      setIsConnecting(true);
      return;
    }

    // Already connected or connection dialog in progress - just close
    if (isConnected || isConnectionDialogOpen) {
      handleClose();
      return;
    }

    // Initiate connection - state machine decides fresh vs reconnect
    connActions.connect();
    handleClose();
  }, [
    onConnect,
    isReconnecting,
    isConnected,
    isConnectionDialogOpen,
    connActions,
    handleClose,
  ]);

  useEffect(() => {
    if (isOpen && (isConnectionDialogOpen || (isConnecting && isConnected))) {
      // Close dialog if connection dialog is opened, or
      // once connected after waiting.
      handleClose();
      return;
    }
  }, [isConnected, handleClose, isConnectionDialogOpen, isOpen, isConnecting]);

  return { handleConnect, isConnecting, handleClose };
};

export default ConnectFirstDialog;
