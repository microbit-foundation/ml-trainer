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
import { ComponentProps } from "react";
import { FormattedMessage } from "react-intl";
import { ButtonWithLoading } from "./ButtonWithLoading";
import { useConnectFirst } from "./ConnectFirstDialog";
import HowItWorksAnimation from "./HowItWorksAnimation/index";
import { AnimationProvider } from "./AnimationProvider";

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
      size={{ base: "full", sm: "full", md: "4xl" }}
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
          <ModalBody>
            <ModalCloseButton />
            <AnimationProvider>
              <HowItWorksAnimation />
            </AnimationProvider>
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
