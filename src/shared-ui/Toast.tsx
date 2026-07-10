/**
 * (c) 2026, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { ReactNode, useMemo } from "react";
import {
  UNSTABLE_Toast as RACToast,
  UNSTABLE_ToastContent as RACToastContent,
  UNSTABLE_ToastQueue as RACToastQueue,
  UNSTABLE_ToastRegion as RACToastRegion,
} from "react-aria-components";
import { IconType } from "react-icons/lib";
import {
  RiAlertFill,
  RiCheckboxCircleFill,
  RiErrorWarningFill,
  RiInformationFill,
} from "react-icons/ri";
import { css, cva } from "styled-system/css";
import { Box } from "styled-system/jsx";
import { Button } from "./Button";
import { CloseIcon } from "./CloseIcon";
import { Icon } from "./Icon";
import { Text } from "./Text";

export type ToastStatus = "info" | "success" | "warning" | "error";

export interface ToastContent {
  /** Dedup key: adding a toast whose id is already visible is a no-op. */
  id?: string;
  title?: ReactNode;
  description?: ReactNode;
  status?: ToastStatus;
  isClosable?: boolean;
}

// Module-level queue shared by useToast() and the <ToastProvider/> region.
// (RAC's Toast API is still flagged UNSTABLE_*; the surface is small and behind
// this module, so a swap to a custom queue later is contained.)
export const toastQueue = new RACToastQueue<ToastContent>({
  maxVisibleToasts: 5,
});

const toastStyle = cva({
  base: {
    position: "relative",
    display: "flex",
    alignItems: "flex-start",
    gap: "3",
    p: "4",
    // Leave room for the absolutely-positioned close button plus breathing space
    // so its hover area never overlaps the title text (24px button at 4px inset
    // spans ~4-28px from the right; content stops at 40px for a ~12px gap).
    paddingRight: "10",
    borderRadius: "md",
    boxShadow: "lg",
    color: "white",
    maxW: "sm",
    pointerEvents: "auto",
  },
  variants: {
    status: {
      info: { bg: "teal.800" },
      success: { bg: "teal.800" },
      warning: { bg: "teal.800" },
      error: { bg: "red.600" },
    },
  },
  defaultVariants: { status: "info" },
});

const regionStyle = css({
  position: "fixed",
  top: "4",
  left: "50%",
  transform: "translateX(-50%)",
  zIndex: "toast",
  display: "flex",
  flexDirection: "column",
  gap: "2",
  pointerEvents: "none",
});

// Status icon matching Chakra's AlertIcon (filled glyphs, coloured by the
// toast foreground = white here). Warning is a triangle, error a circle, as
// in Chakra — the glyph must distinguish them because the colours alone
// don't reliably (and the icon is the only non-text status signal).
const statusIcon: Record<ToastStatus, IconType> = {
  info: RiInformationFill,
  success: RiCheckboxCircleFill,
  warning: RiAlertFill,
  error: RiErrorWarningFill,
};

/**
 * Mount once near the app root. Renders the live region that announces and
 * displays queued toasts.
 */
export const ToastProvider = () => (
  <RACToastRegion queue={toastQueue} className={regionStyle}>
    {({ toast }) => (
      <RACToast
        toast={toast}
        className={toastStyle({ status: toast.content.status })}
      >
        <Icon
          as={statusIcon[toast.content.status ?? "info"]}
          css={{ fontSize: "1.25rem", flexShrink: 0 }}
          aria-hidden
        />
        <RACToastContent>
          {toast.content.title && (
            <Text fontWeight="bold">{toast.content.title}</Text>
          )}
          {toast.content.description && (
            <Box css={{ mt: "1" }}>{toast.content.description}</Box>
          )}
        </RACToastContent>
        {toast.content.isClosable && (
          <Button
            slot="close"
            variant="unstyled"
            aria-label="Close"
            css={{
              // A sized box with the glyph centred (like Chakra's CloseButton)
              // gives padding around the X and a hover affordance.
              position: "absolute",
              top: "1",
              insetEnd: "1",
              color: "white",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              // Chakra toast uses CloseButton size="sm": 24px box, 2xs glyph.
              width: "6",
              height: "6",
              minHeight: "0",
              minWidth: "0",
              padding: "0",
              fontSize: "2xs",
              borderRadius: "md",
              // Chakra's CloseButton hover is a subtle dark overlay (blackAlpha)
              // in light mode, not a bright highlight.
              _hover: { bg: "blackAlpha.100" },
              _active: { bg: "blackAlpha.200" },
            }}
          >
            <CloseIcon />
          </Button>
        )}
      </RACToast>
    )}
  </RACToastRegion>
);

export interface ToastOptions extends ToastContent {
  /**
   * Auto-dismiss after ms; null means no auto-dismiss (Chakra's semantics).
   * RAC enforces a 5000ms minimum for accessibility.
   */
  duration?: number | null;
}

export interface ToastFn {
  (options: ToastOptions): void;
  /** Whether a toast with this id is currently visible. */
  isActive(id: string): boolean;
  /**
   * Replace a visible toast's content (Chakra's toast.update). The toast is
   * re-added, so unlike Chakra it re-animates and restarts any timeout.
   */
  update(id: string, options: ToastOptions): void;
}

/**
 * useToast — imperative toast trigger matching the shape of Chakra's
 * `useToast()` call sites: `toast({ title, description, status, duration })`.
 */
export const useToast = (): ToastFn =>
  useMemo(() => {
    const isActive = (id: string) =>
      toastQueue.visibleToasts.some((t) => t.content.id === id);
    const add = ({
      id,
      title,
      description,
      status,
      isClosable,
      duration,
    }: ToastOptions) => {
      if (id && isActive(id)) {
        return;
      }
      toastQueue.add(
        { id, title, description, status, isClosable },
        { timeout: duration ?? undefined }
      );
    };
    const update = (id: string, options: ToastOptions) => {
      const existing = toastQueue.visibleToasts.find(
        (t) => t.content.id === id
      );
      if (existing) {
        toastQueue.close(existing.key);
      }
      add({ ...options, id });
    };
    return Object.assign(add, { isActive, update });
  }, []);
