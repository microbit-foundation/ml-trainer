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
  HStack,
  ModalCloseButton,
  ModalHeader,
  VStack,
} from "@chakra-ui/react";
import { ReactNode } from "react";
import { FormattedMessage } from "react-intl";

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
      size="3xl"
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
          <ModalFooter justifyContent={footerLeft ? "space-between" : "end"}>
            {footerLeft && footerLeft}
            <HStack gap={5}>
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
            </HStack>
          </ModalFooter>
        </ModalContent>
      </ModalOverlay>
    </Modal>
  );
};

export default ConnectContainerDialog;
