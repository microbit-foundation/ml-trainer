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

export interface HomepageBannerVideoTranscriptDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const HomepageBannerVideoTranscriptDialog = ({
  isOpen,
  onClose,
}: HomepageBannerVideoTranscriptDialogProps) => {
  return (
    <Modal
      closeOnOverlayClick={false}
      motionPreset="none"
      isOpen={isOpen}
      onClose={onClose}
      size={{ base: "full", md: "3xl" }}
      isCentered
    >
      <ModalOverlay>
        <ModalContent>
          <ModalHeader as="h2">
            <FormattedMessage id="homepage-media-descriptive-transcript-dialog-heading" />
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack width="100%" alignItems="left">
              <Text>
                <FormattedMessage id="homepage-media-descriptive-transcript-dialog-content-1" />
              </Text>
              <Text>
                <FormattedMessage id="homepage-media-descriptive-transcript-dialog-content-2" />
              </Text>
              <Text>
                <FormattedMessage id="homepage-media-descriptive-transcript-dialog-content-3" />
              </Text>
              <Text>
                <FormattedMessage id="homepage-media-descriptive-transcript-dialog-content-4" />
              </Text>
              <Text>
                <FormattedMessage id="homepage-media-descriptive-transcript-dialog-content-5" />
              </Text>
              <Text>
                <FormattedMessage id="homepage-media-descriptive-transcript-dialog-content-6" />
              </Text>
              <Text>
                <FormattedMessage id="homepage-media-descriptive-transcript-dialog-content-7" />
              </Text>
              <Text>
                <FormattedMessage id="homepage-media-descriptive-transcript-dialog-content-8" />
              </Text>
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

export default HomepageBannerVideoTranscriptDialog;
