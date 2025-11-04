/**
 * (c) 2024, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalOverlay,
} from "@chakra-ui/modal";
import {
  Button,
  ModalCloseButton,
  ModalHeader,
  VStack,
  Text,
} from "@chakra-ui/react";
import { FormattedMessage } from "react-intl";

export interface HomepageMediaTextTranscriptDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const HomepageMediaTextTranscriptDialog = ({
  isOpen,
  onClose,
}: HomepageMediaTextTranscriptDialogProps) => {
  return (
    <Modal
      closeOnOverlayClick={false}
      motionPreset="none"
      isOpen={isOpen}
      onClose={onClose}
      size="3xl"
      isCentered
    >
      <ModalOverlay>
        <ModalContent>
          <ModalHeader as="h2">
            <FormattedMessage id="homepage-media-text-transcript-dialog-heading" />
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack width="100%" alignItems="left">
              <Text>
                Audio information is not needed: There is no sound in this
                video.
              </Text>
              <Text>
                A girl waves her hand while holding a micro:bit. A meter at the
                bottom of the video shows the machine learning model detecting
                "Waving" rather than "Clapping".
              </Text>
              <Text>
                The scene transitions to another girl clapping her hands. She
                has a micro:bit strapped to her wrist. As she claps, the meter
                updates to show the model detecting "Clapping" rather than
                "Waving".
              </Text>
              <Text>
                The meter now displays "Bouncing" versus "Running". The scene
                changes to a girl bouncing a tennis ball with a racket. A
                micro:bit is strapped to the racket. The model detects
                "Bouncing" rather than "Running" as she bounces the ball.
              </Text>
              <Text>
                The scene shifts to a boy running across a field. As he runs,
                the model detects "Running" rather than "Bouncing".
              </Text>
              <Text>
                The meter changes to show "Jumping" versus "Walking". Six
                children stand in a field preparing to jump with their arms
                raised. Initially, the model detects "Walking" rather than
                "Jumping". As the children leap into the air, the detection
                switches to "Jumping" rather than "Walking".
              </Text>
              <Text>
                The children land and walk across the field. The detection
                returns to "Walking" rather than "Jumping".
              </Text>
              <Text>This video plays on a continuous loop.</Text>
            </VStack>
          </ModalBody>
          <ModalFooter justifyContent="end">
            <Button onClick={onClose} variant="primary" size="lg">
              <FormattedMessage id="close-action" />
            </Button>
          </ModalFooter>
        </ModalContent>
      </ModalOverlay>
    </Modal>
  );
};

export default HomepageMediaTextTranscriptDialog;
