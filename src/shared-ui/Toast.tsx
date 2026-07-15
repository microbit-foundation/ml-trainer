/**
 * (c) 2026, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { ReactNode, useMemo } from "react";
import {
  Button as RACButton,
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
import { toast as toastRecipe } from "styled-system/recipes";
import { CloseIcon } from "./CloseIcon";
import { Icon } from "./Icon";
import { useSharedUIStrings } from "./SharedUIProvider";
import { VisuallyHidden } from "./VisuallyHidden";

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

// Status icon matching Chakra's AlertIcon (filled glyphs, coloured by the
// toast foreground = white here). Warning is a triangle, error a circle, as
// in Chakra — the glyph must distinguish them because the colours alone
// don't reliably. The icon is decorative; the status is announced via the
// visually hidden status text.
const statusIcon: Record<ToastStatus, IconType> = {
  info: RiInformationFill,
  success: RiCheckboxCircleFill,
  warning: RiAlertFill,
  error: RiErrorWarningFill,
};

/**
 * Mount once near the app root, inside the SharedUIProvider (the close
 * button's label and the status announcements come from its strings).
 * Renders the live region that announces and displays queued toasts.
 */
export const ToastProvider = () => {
  const strings = useSharedUIStrings();
  const slots = toastRecipe();
  return (
    <RACToastRegion queue={toastQueue} className={slots.region}>
      {({ toast }) => {
        const status = toast.content.status ?? "info";
        return (
          <RACToast toast={toast} className={toastRecipe({ status }).root}>
            <Icon as={statusIcon[status]} className={slots.icon} aria-hidden />
            <RACToastContent>
              {/* Colour and icon are the only visible status signals; say it
                  for assistive tech too. */}
              <VisuallyHidden>{strings.toastStatuses[status]} </VisuallyHidden>
              {toast.content.title && (
                <p className={slots.title}>{toast.content.title}</p>
              )}
              {toast.content.description && (
                <div className={slots.description}>
                  {toast.content.description}
                </div>
              )}
            </RACToastContent>
            {toast.content.isClosable && (
              <RACButton
                slot="close"
                aria-label={strings.close}
                className={slots.closeButton}
              >
                <CloseIcon />
              </RACButton>
            )}
          </RACToast>
        );
      }}
    </RACToastRegion>
  );
};

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
        {
          id,
          title,
          description,
          status,
          // A toast that never times out must be dismissable or it is
          // permanent and unremovable; force the close button on.
          isClosable: isClosable || duration == null,
        },
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
