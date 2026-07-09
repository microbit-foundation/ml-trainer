/**
 * (c) 2026, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { createContext, ReactNode, RefObject, useContext } from "react";
import {
  Button as RACButton,
  Dialog,
  Heading as RACHeading,
  Modal as RACModal,
  ModalOverlay,
} from "react-aria-components";
import { css, cx } from "styled-system/css";
import { dialog } from "styled-system/recipes";
import { ConditionalValue, SystemStyleObject } from "styled-system/types";
import { CloseIcon } from "./CloseIcon";
import { UnmountCallback } from "./UnmountCallback";

type DialogSlots = ReturnType<typeof dialog>;

const SlotContext = createContext<{ slots: DialogSlots; onClose: () => void }>({
  slots: dialog({}),
  onClose: () => undefined,
});

const useDialog = () => useContext(SlotContext);

export type ModalSize = ConditionalValue<
  | "xs"
  | "sm"
  | "md"
  | "lg"
  | "xl"
  | "2xl"
  | "3xl"
  | "4xl"
  | "5xl"
  | "6xl"
  | "full"
>;

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  size?: ModalSize;
  /** Allow closing by clicking the backdrop / pressing Escape (default true). */
  isDismissable?: boolean;
  /**
   * Use "alertdialog" for confirmations that interrupt the user (Chakra's
   * AlertDialog).
   */
  role?: "dialog" | "alertdialog";
  /** Vertically centre the dialog (Chakra's `isCentered`). */
  isCentered?: boolean;
  /**
   * Called after the dialog has fully closed (exit transition done and the
   * dialog removed). Matches Chakra's `onCloseComplete`.
   */
  onCloseComplete?: () => void;
  /**
   * Element to focus when the dialog closes, instead of the element that was
   * focused when it opened. Matches Chakra's `finalFocusRef`.
   */
  finalFocusRef?: RefObject<HTMLElement>;
  children: ReactNode;
}

/**
 * Modal — a focus-trapping dialog. Collapses Chakra's
 * Modal/ModalOverlay/ModalContent into a single shell; place ModalHeader,
 * ModalBody and ModalFooter inside.
 */
export const Modal = ({
  isOpen,
  onClose,
  size,
  isDismissable = true,
  role,
  isCentered,
  onCloseComplete,
  finalFocusRef,
  children,
}: ModalProps) => {
  const slots = dialog({ size, centered: isCentered });
  const handleUnmount = () => {
    onCloseComplete?.();
    const el = finalFocusRef?.current;
    if (el) {
      // After RAC's own focus restoration, which also runs on unmount.
      requestAnimationFrame(() => el.focus());
    }
  };
  return (
    <ModalOverlay
      isOpen={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          onClose();
        }
      }}
      isDismissable={isDismissable}
      className={slots.overlay}
    >
      <UnmountCallback callback={handleUnmount} />
      <RACModal className={slots.content}>
        <Dialog role={role} className={slots.inner}>
          <SlotContext.Provider value={{ slots, onClose }}>
            {children}
          </SlotContext.Provider>
        </Dialog>
      </RACModal>
    </ModalOverlay>
  );
};

interface SlotProps {
  children: ReactNode;
  css?: SystemStyleObject;
  className?: string;
}

/** Modal title. Rendered as RAC's labelling heading for the dialog. */
export const ModalHeader = ({
  children,
  css: cssProp,
  className,
}: SlotProps) => {
  const { slots } = useDialog();
  return (
    <RACHeading
      slot="title"
      className={cx(
        slots.header,
        cssProp ? css(cssProp) : undefined,
        className
      )}
    >
      {children}
    </RACHeading>
  );
};

export const ModalBody = ({ children, css: cssProp, className }: SlotProps) => {
  const { slots } = useDialog();
  return (
    <div
      className={cx(slots.body, cssProp ? css(cssProp) : undefined, className)}
    >
      {children}
    </div>
  );
};

export const ModalFooter = ({
  children,
  css: cssProp,
  className,
}: SlotProps) => {
  const { slots } = useDialog();
  return (
    <div
      className={cx(
        slots.footer,
        cssProp ? css(cssProp) : undefined,
        className
      )}
    >
      {children}
    </div>
  );
};

export interface ModalCloseButtonProps {
  /** Accessible name; defaults to "Close" matching Chakra's CloseButton. */
  "aria-label"?: string;
}

/**
 * ModalCloseButton — the X in the dialog's top corner (Chakra's
 * ModalCloseButton at its default md size). Closes via the Modal's onClose.
 */
export const ModalCloseButton = ({
  "aria-label": ariaLabel = "Close",
}: ModalCloseButtonProps) => {
  const { slots, onClose } = useDialog();
  return (
    <RACButton
      aria-label={ariaLabel}
      onPress={onClose}
      className={cx(
        slots.closeTrigger,
        css({
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: "8",
          height: "8",
          fontSize: "xs",
          borderRadius: "md",
          cursor: "pointer",
          bg: "transparent",
          border: "none",
          color: "inherit",
          outline: "none",
          transitionProperty: "background-color, box-shadow",
          transitionDuration: "normal",
          _hover: { bg: "blackAlpha.100" },
          _active: { bg: "blackAlpha.200" },
          _focusVisible: { boxShadow: "outline" },
        })
      )}
    >
      <CloseIcon />
    </RACButton>
  );
};
