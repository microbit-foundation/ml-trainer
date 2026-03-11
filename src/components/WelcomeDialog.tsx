/**
 * (c) 2024, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import {
  Button,
  Icon,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Text,
  VStack,
} from "@chakra-ui/react";
import { ComponentProps } from "react";
import { RiPlayFill } from "react-icons/ri";
import { FormattedMessage } from "react-intl";
import { AnimationProvider, useAnimation } from "./AnimationProvider";
import { ButtonWithLoading } from "./ButtonWithLoading";
import { useConnectFirst } from "./ConnectFirstDialog";
import HowItWorksAnimation from "./HowItWorksAnimation/index";
import PauseIcon from "./icons/PauseIcon";

type WelcomeDialogProps = Omit<ComponentProps<typeof Modal>, "children">;

const WelcomeDialog = ({ onClose, isOpen, ...rest }: WelcomeDialogProps) => {
  const { handleClose, isConnecting, handleConnect } = useConnectFirst({
    isOpen,
    onClose,
  });

  return (
    <AnimationProvider>
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
              <HowItWorksAnimation />
            </ModalBody>
            <ModalFooter justifyContent="space-between">
              <VStack alignItems="start">
                <PauseResumeButton />
              </VStack>
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
    </AnimationProvider>
  );
};

const PauseResumeButton = () => {
  const { pause, isPaused, resume } = useAnimation();
  return isPaused ? (
    <Button variant="link" onClick={resume} leftIcon={<Icon as={RiPlayFill} />}>
      <FormattedMessage id="animation-resume-action" />
    </Button>
  ) : (
    <Button variant="link" onClick={pause} leftIcon={<PauseIcon />}>
      <FormattedMessage id="animation-pause-action" />
    </Button>
  );
};

export default WelcomeDialog;
