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
} from "@chakra-ui/react";
import { ReactNode } from "react";
import { FormattedMessage } from "react-intl";
import ModalFooterContent from "./ModalFooterContent";

export interface ConnectContainerDialogProps {
  isOpen: boolean;
  onClose: () => void;
  headingId: string;
  footerLeft?: ReactNode;
  onNextClick?: () => void;
  children: ReactNode;
  onBackClick?: () => void;
  additionalActions?: ReactNode;
}

const ConnectContainerDialog = ({
  isOpen,
  onClose,
  headingId,
  footerLeft,
  onNextClick,
  onBackClick,
  additionalActions,
  children,
}: ConnectContainerDialogProps) => {
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
            <FormattedMessage id={headingId} />
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack width="100%" alignItems="left">
              {children}
            </VStack>
          </ModalBody>
          <ModalFooter>
            <ModalFooterContent leftContent={footerLeft}>
              {onBackClick && (
                <Button onClick={onBackClick} variant="secondary" size="lg">
                  <FormattedMessage id="back-action" />
                </Button>
              )}
              {additionalActions}
              {onNextClick && (
                <Button onClick={onNextClick} variant="primary" size="lg">
                  <FormattedMessage id="next-action" />
                </Button>
              )}
            </ModalFooterContent>
          </ModalFooter>
        </ModalContent>
      </ModalOverlay>
    </Modal>
  );
};

export default ConnectContainerDialog;
