/**
 * (c) 2026, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { createContext, ReactNode, useContext } from "react";
import {
  Dialog,
  Heading as RACHeading,
  Modal as RACModal,
  ModalOverlay,
} from "react-aria-components";
import { css, cx } from "styled-system/css";
import { dialog } from "styled-system/recipes";
import { ConditionalValue, SystemStyleObject } from "styled-system/types";

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
  children,
}: ModalProps) => {
  const slots = dialog({ size });
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
      <RACModal className={slots.content}>
        <Dialog className={slots.inner}>
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
