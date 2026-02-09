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
          <ModalBody>
            <ModalCloseButton />
            <AspectRatio ratio={2 / 1}>
              <Box
                as="video"
                autoPlay
                loop
                muted
                src={preConnectVideo}
                // TODO: improve!
                aria-label="Animation showing the use of CreateAI with a Connect, Collect data, Test model, Code and Use steps. Data is collected from a micro:bit attached to a wrist for two movements: a wave (with a heart icon) and a shake (with a cross icon). A machine learning model is trained and then tested. Arrows show more data being collected to improve the model. MakeCode blocks show the user writing code that uses the model. The user uses their program to show icons on the micro:bit depending on their movement."
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
