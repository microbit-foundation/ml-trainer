/**
 * (c) 2021, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { Button } from "@chakra-ui/button";
import {
  AlertDialog,
  AlertDialogBody,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
} from "@chakra-ui/modal";
import { Heading } from "@chakra-ui/react";
import { ReactNode, useRef } from "react";
import { useIntl } from "react-intl";

export interface ConfirmDialogProps {
  isOpen: boolean;
  heading: ReactNode;
  body: ReactNode;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
}

export const ConfirmDialog = ({
  isOpen,
  heading,
  body,
  onConfirm,
  onCancel,
  confirmText,
  cancelText,
}: ConfirmDialogProps) => {
  const intl = useIntl();
  confirmText = confirmText ?? intl.formatMessage({ id: "confirm-action" });
  cancelText = cancelText ?? intl.formatMessage({ id: "cancel-action" });
  const leastDestructiveRef = useRef<HTMLButtonElement>(null);
  return (
    <AlertDialog
      isOpen={isOpen}
      leastDestructiveRef={leastDestructiveRef}
      onClose={onCancel}
      size="md"
      isCentered
    >
      <AlertDialogOverlay>
        <AlertDialogContent>
          <AlertDialogHeader>
            <Heading as="h2" size="md">
              {heading}
            </Heading>
          </AlertDialogHeader>
          <AlertDialogBody>{body}</AlertDialogBody>
          <AlertDialogFooter>
            <Button ref={leastDestructiveRef} onClick={onCancel}>
              {cancelText}
            </Button>
            <Button
              variant="solid"
              colorScheme="red"
              onClick={onConfirm}
              ml={3}
            >
              {confirmText}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialogOverlay>
    </AlertDialog>
  );
};
