/**
 * (c) 2024, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import {
  Button,
  HStack,
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
import { useStore } from "../store";
import ExternalLink from "./ExternalLink";
import { useDeployment } from "../deployment";

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
      size="2xl"
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
          <ModalFooter justifyContent="space-between">
            <ExternalLink
              textId="learn-about-firewall-requirements-action"
              href="https://support.microbit.org/support/solutions/articles/19000030385-firewall-requirements-for-micro-bit-editors-and-websites"
            />
            <HStack gap={5}>
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
            </HStack>
          </ModalFooter>
        </ModalContent>
      </ModalOverlay>
    </Modal>
  );
};

export default MakeCodeLoadErrorDialog;
