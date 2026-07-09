/**
 * (c) 2024, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { ReactNode } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import {
  Button,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalFooter,
  ModalHeader,
  VStack,
} from "../shared-ui";
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
  const intl = useIntl();
  return (
    <Modal
      isDismissable={false}
      motionless
      isOpen={isOpen}
      onClose={onClose}
      size={{ base: "full", md: "3xl" }}
      isCentered
    >
      <ModalHeader level={2}>
        <FormattedMessage id={headingId} />
      </ModalHeader>
      <ModalCloseButton
        aria-label={intl.formatMessage({ id: "close-action" })}
      />
      <ModalBody>
        <VStack width="100%" alignItems="stretch">
          {children}
        </VStack>
      </ModalBody>
      <ModalFooter>
        <ModalFooterContent leftContent={footerLeft}>
          {onBackClick && (
            <Button onPress={onBackClick} variant="secondary" size="lg">
              <FormattedMessage id="back-action" />
            </Button>
          )}
          {additionalActions}
          {onNextClick && (
            <Button onPress={onNextClick} variant="primary" size="lg">
              <FormattedMessage id="next-action" />
            </Button>
          )}
        </ModalFooterContent>
      </ModalFooter>
    </Modal>
  );
};

export default ConnectContainerDialog;
