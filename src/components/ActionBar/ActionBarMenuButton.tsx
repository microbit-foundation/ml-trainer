/**
 * (c) 2026, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { forwardRef, ReactNode } from "react";
import { IconButton } from "../../shared-ui";

interface ActionBarMenuButtonProps {
  "aria-label": string;
  /** Remove from layout (used at the native tablet breakpoint). */
  hidden?: boolean;
  /** The icon glyph. */
  children: ReactNode;
}

/**
 * The circular white icon-button that triggers the action-bar menus (settings,
 * help). Kept as a component rather than a shared style object so Panda can
 * statically extract the inline `css` — it only reads `css` prop literals at the
 * JSX site, not objects returned from a helper. Dimensions come from the
 * `size="lg"` recipe variant (48px) rather than utility overrides, which the
 * recipe's size variant would otherwise beat.
 */
export const ActionBarMenuButton = forwardRef<
  HTMLButtonElement,
  ActionBarMenuButtonProps
>(function ActionBarMenuButton({ hidden, children, ...rest }, ref) {
  return (
    <IconButton
      ref={ref}
      variant="plain"
      size="lg"
      isRound
      css={{
        display: hidden ? "none" : undefined,
        color: "white",
        _focusVisible: { focusShadow: "outlineDark" },
      }}
      {...rest}
    >
      {children}
    </IconButton>
  );
});
