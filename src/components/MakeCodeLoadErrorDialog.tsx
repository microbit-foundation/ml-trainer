/**
 * (c) 2024, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import {
  Button,
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
import { useCallback } from "react";
import { FormattedMessage } from "react-intl";
import { useDeployment } from "../deployment";
import { useStore } from "../store";
import ExternalLink from "./ExternalLink";
import ModalFooterContent from "./ModalFooterContent";

const MakeCodeLoadErrorDialog = () => {
  const isOpen = useStore((s) => s.isEditorTimedOutDialogOpen);
  const setIsOpen = useStore((s) => s.setIsEditorTimedOutDialogOpen);
  const onClose = useCallback(() => setIsOpen(false), [setIsOpen]);
  const { appNameFull } = useDeployment();
  return (
    <Modal
      motionPreset="none"
      isOpen={isOpen}
      onClose={onClose}
      size={{ base: "full", md: "2xl" }}
      isCentered
    >
      <ModalOverlay>
        <ModalContent>
          <ModalHeader>
            <FormattedMessage id="makecode-load-error-dialog-title" />
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack textAlign="left" w="100%">
              <Text w="100%">
                <FormattedMessage
                  id="makecode-load-error-dialog-body"
                  values={{ appNameFull }}
                />
              </Text>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <ModalFooterContent
              leftContent={
                <ExternalLink
                  textId="learn-about-firewall-requirements-action"
                  href="https://support.microbit.org/support/solutions/articles/19000030385-firewall-requirements-for-micro-bit-editors-and-websites"
                />
              }
            >
              <Button onClick={onClose} variant="secondary" size="lg">
                <FormattedMessage id="cancel-action" />
              </Button>
              <Button
                onClick={() => window.location.reload()}
                variant="primary"
                size="lg"
              >
                <FormattedMessage id="reload-action" />
              </Button>
            </ModalFooterContent>
          </ModalFooter>
        </ModalContent>
      </ModalOverlay>
    </Modal>
  );
};

export default MakeCodeLoadErrorDialog;
