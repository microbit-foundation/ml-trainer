/**
 * (c) 2026, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { createContext, ReactNode, useContext, useMemo } from "react";

/**
 * Localized strings shared-ui components need internally. Supplied by the app
 * (via its own i18n pipeline) so shared-ui has no dependency on a particular
 * i18n library or message catalogue.
 */
export interface SharedUIStrings {
  /** Accessible label for close buttons (dialogs, toasts). */
  close: string;
}

/**
 * Registers the close function of the currently open dismissable overlay, or
 * clears it (null) when the overlay closes. Installed by apps that need to
 * dismiss overlays from outside the component tree — e.g. the Android
 * hardware back button. Only one overlay is open at a time.
 */
export type OverlayCloseRegistrar = (close: (() => void) | null) => void;

interface SharedUIContextValue {
  strings: SharedUIStrings;
  overlayCloseRegistrar?: OverlayCloseRegistrar;
}

const SharedUIContext = createContext<SharedUIContextValue | null>(null);

export interface SharedUIProviderProps {
  strings: SharedUIStrings;
  overlayCloseRegistrar?: OverlayCloseRegistrar;
  children: ReactNode;
}

/**
 * SharedUIProvider — the app-side installation point for shared-ui. Mount it
 * once, above any shared-ui usage (and re-render it with new `strings` on
 * locale change).
 */
export const SharedUIProvider = ({
  strings,
  overlayCloseRegistrar,
  children,
}: SharedUIProviderProps) => {
  const value = useMemo(
    () => ({ strings, overlayCloseRegistrar }),
    [strings, overlayCloseRegistrar]
  );
  return (
    <SharedUIContext.Provider value={value}>
      {children}
    </SharedUIContext.Provider>
  );
};

export const useSharedUIStrings = (): SharedUIStrings => {
  const value = useContext(SharedUIContext);
  if (!value) {
    throw new Error("Missing SharedUIProvider above a shared-ui component.");
  }
  return value.strings;
};

/**
 * The app-installed overlay-close registrar, if any. Overlay components run
 * controlled and register their close function while open so the app can
 * dismiss them; without a registrar they manage open state internally.
 */
export const useOverlayCloseRegistrar = (): OverlayCloseRegistrar | undefined =>
  useContext(SharedUIContext)?.overlayCloseRegistrar;
