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
  const actions = useDataConnectionActions();
  const dataConnection = useStore((s) => s.dataConnection);
  const isConnected = dataConnection.step === DataConnectionStep.Connected;
  const isReconnecting = dataConnection.isReconnecting;
  const isConnectionDialogOpen = isDataConnectionDialogOpen(
    dataConnection.step
  );
  const [isWaiting, setIsWaiting] = useState<boolean>(false);

  const handleOnClose = useCallback(() => {
    setIsWaiting(false);
    onClose();
  }, [onClose]);

  const handleConnect = useCallback(() => {
    onChooseConnect?.();

    // Auto-reconnection in progress - show loading and wait for it
    if (isReconnecting) {
      setIsWaiting(true);
      return;
    }

    // Already connected or connection dialog in progress - just close
    if (isConnected || isConnectionDialogOpen) {
      handleOnClose();
      return;
    }

    // Initiate connection - state machine decides fresh vs reconnect
    actions.connect();
    handleOnClose();
  }, [
    onChooseConnect,
    isReconnecting,
    isConnected,
    isConnectionDialogOpen,
    actions,
    handleOnClose,
  ]);

  useEffect(() => {
    if (isOpen && (isConnectionDialogOpen || (isWaiting && isConnected))) {
      // Close dialog if connection dialog is opened, or
      // once connected after waiting.
      handleOnClose();
      return;
    }
  }, [isConnected, handleOnClose, isConnectionDialogOpen, isOpen, isWaiting]);

  return (
    <Modal
      closeOnOverlayClick={false}
      motionPreset="none"
      size="md"
      isCentered
      onClose={handleOnClose}
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
              isLoading={isWaiting}
            >
              <FormattedMessage id="connect-action" />
            </ButtonWithLoading>
          </ModalFooter>
        </ModalContent>
      </ModalOverlay>
    </Modal>
  );
};

export default ConnectFirstDialog;
