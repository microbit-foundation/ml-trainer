/**
 * (c) 2021, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { ReactNode } from "react";
import { useIntl } from "react-intl";
import {
  Button,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
} from "../shared-ui";

export interface ConfirmDialogProps {
  isOpen: boolean;
  heading: ReactNode;
  body: ReactNode;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
  finalFocusRef?: React.RefObject<HTMLElement>;
  onCloseComplete?: () => void;
}

export const ConfirmDialog = ({
  isOpen,
  heading,
  body,
  onConfirm,
  onCancel,
  onCloseComplete,
  confirmText,
  cancelText,
  finalFocusRef,
}: ConfirmDialogProps) => {
  const intl = useIntl();
  confirmText = confirmText ?? intl.formatMessage({ id: "confirm-action" });
  cancelText = cancelText ?? intl.formatMessage({ id: "cancel-action" });
  return (
    <Modal
      isOpen={isOpen}
      onClose={onCancel}
      role="alertdialog"
      size="md"
      isCentered
      finalFocusRef={finalFocusRef}
      onCloseComplete={onCloseComplete}
    >
      <ModalHeader css={{ fontWeight: "bold", lineHeight: 1.2 }}>
        {heading}
      </ModalHeader>
      <ModalBody>{body}</ModalBody>
      <ModalFooter>
        {/* Least-destructive action gets initial focus (AlertDialog pattern). */}
        <Button autoFocus onPress={onCancel}>
          {cancelText}
        </Button>
        <Button variant="warningSolid" onPress={onConfirm} css={{ ml: 3 }}>
          {confirmText}
        </Button>
      </ModalFooter>
    </Modal>
  );
};
