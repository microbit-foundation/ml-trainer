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
import { ComponentProps } from "react";
import { FormattedMessage } from "react-intl";
import preConnectVideo from "../images/pre-connect-video.mp4";
import { ButtonWithLoading } from "./ButtonWithLoading";
import { useConnectFirst } from "./ConnectFirstDialog";

type WelcomeDialogProps = Omit<ComponentProps<typeof Modal>, "children">;

const WelcomeDialog = ({ onClose, isOpen, ...rest }: WelcomeDialogProps) => {
  const { handleClose, isConnecting, handleConnect } = useConnectFirst({
    isOpen,
    onClose,
  });

  return (
    <Modal
      closeOnOverlayClick={false}
      motionPreset="none"
      size="4xl"
      isCentered
      onClose={handleClose}
      isOpen={isOpen}
      {...rest}
    >
      <ModalOverlay>
        <ModalContent>
          <ModalHeader>
            <Text>
              <FormattedMessage id="welcome-title" />
            </Text>
          </ModalHeader>
          <ModalBody pb={5}>
            <ModalCloseButton />
            <AspectRatio ratio={3.89}>
              <Box
                as="video"
                autoPlay
                loop
                muted
                // Crop out thin visible outline in video.
                clipPath="polygon(1% 1%, 99% 1%, 99% 99%, 0 99%)"
                src={preConnectVideo}
                // TODO: Alt text for video.
              />
            </AspectRatio>
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

export default WelcomeDialog;
