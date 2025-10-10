/**
 * (c) 2024, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import {
  AspectRatio,
  Box,
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
import { ButtonWithLoading } from "./ButtonWithLoading";
import preConnectVideo from "../images/pre-connect-video.mp4";

interface WelcomeDialogProps
  extends Omit<ComponentProps<typeof Modal>, "children"> {
  onChooseConnect?: () => void;
}

const WelcomeDialog = ({
  onClose,
  onChooseConnect,
  isOpen,
  ...rest
}: WelcomeDialogProps) => {
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
    onClose();
    onChooseConnect?.();
    switch (connStatus) {
      case ConnectionStatus.FailedToConnect:
      case ConnectionStatus.FailedToReconnectTwice:
      case ConnectionStatus.FailedToSelectBluetoothDevice:
      case ConnectionStatus.NotConnected: {
        // Start connection flow.
        actions.startConnect({});
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
  }, [onClose, onChooseConnect, connStatus, actions, handleOnClose]);

  useEffect(() => {
    if (
      isOpen &&
      (isConnectionDialogOpen ||
        (isWaiting && connStatus === ConnectionStatus.Connected))
    ) {
      // Close dialog if connection dialog is opened, or
      // once connected after waiting.
      handleOnClose();
      return;
    }
  }, [
    connStatus,
    handleOnClose,
    isConnectionDialogOpen,
    isOpen,
    isWaiting,
    onClose,
  ]);

  return (
    <Modal
      closeOnOverlayClick={false}
      motionPreset="none"
      size="xl"
      isCentered
      onClose={handleOnClose}
      isOpen={isOpen}
      {...rest}
    >
      <ModalOverlay>
        <ModalContent>
          <ModalHeader>
            <Text>Welcome to micro:bit CreateAI</Text>
          </ModalHeader>
          <ModalBody p={20}>
            <ModalCloseButton />
            <AspectRatio ratio={7.3 / 2}>
              <Box as="video" autoPlay loop src={preConnectVideo} />
            </AspectRatio>
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

export default WelcomeDialog;
