/**
 * (c) 2026, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { createContext, ReactNode, useContext } from "react";
import { Dialog, Modal as RACModal, ModalOverlay } from "react-aria-components";
import { css, cx } from "styled-system/css";
import { drawer, DrawerVariantProps } from "styled-system/recipes";
import { SystemStyleObject } from "styled-system/types";
import { UnmountCallback } from "./UnmountCallback";

type DrawerSlots = ReturnType<typeof drawer>;

const SlotContext = createContext<DrawerSlots>(drawer({}));

export interface DrawerProps extends DrawerVariantProps {
  isOpen: boolean;
  onClose: () => void;
  /**
   * Called after the drawer has fully closed (exit transition done and the
   * drawer removed). Matches Chakra's `onCloseComplete`.
   */
  onCloseComplete?: () => void;
  /** Allow closing by clicking the backdrop / pressing Escape (default true). */
  isDismissable?: boolean;
  /**
   * Accessible name for the dialog. Required as the drawer has no title
   * heading slot.
   */
  "aria-label": string;
  children: ReactNode;
}

/**
 * Drawer — a focus-trapping panel that slides in from the side. Collapses
 * Chakra's Drawer/DrawerOverlay/DrawerContent into a single shell; place
 * DrawerHeader and DrawerBody inside.
 */
export const Drawer = ({
  isOpen,
  onClose,
  onCloseComplete,
  placement,
  isDismissable = true,
  "aria-label": ariaLabel,
  children,
}: DrawerProps) => {
  const slots = drawer({ placement });
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
      <UnmountCallback callback={onCloseComplete} />
      <RACModal className={slots.content}>
        <Dialog aria-label={ariaLabel} className={slots.inner}>
          <SlotContext.Provider value={slots}>{children}</SlotContext.Provider>
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

export const DrawerHeader = ({
  children,
  css: cssProp,
  className,
}: SlotProps) => {
  const slots = useContext(SlotContext);
  return (
    <div
      className={cx(
        slots.header,
        cssProp ? css(cssProp) : undefined,
        className
      )}
    >
      {children}
    </div>
  );
};

export const DrawerBody = ({
  children,
  css: cssProp,
  className,
}: SlotProps) => {
  const slots = useContext(SlotContext);
  return (
    <div
      className={cx(slots.body, cssProp ? css(cssProp) : undefined, className)}
    >
      {children}
    </div>
  );
};
