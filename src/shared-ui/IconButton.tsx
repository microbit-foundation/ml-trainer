/**
 * (c) 2026, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { forwardRef } from "react";
import { Button, ButtonProps } from "./Button";

export interface IconButtonProps
  extends Omit<ButtonProps, "leftIcon" | "rightIcon"> {
  /** Icon-only buttons have no visible label, so this is required. */
  "aria-label": string;
  /** Circular rather than the recipe's border-radius (Chakra's `isRound`). */
  isRound?: boolean;
}

/**
 * IconButton — a square, icon-only Button. Zeroes the recipe's horizontal
 * padding (its size variants add `px`, which would squeeze a single glyph in a
 * fixed-width button) and keeps the `minW` from the size so the box stays
 * square. Pass the icon as children.
 */
export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  function IconButton({ isRound, css: cssProp, children, ...rest }, ref) {
    return (
      <Button
        ref={ref}
        css={{
          px: 0,
          ...(isRound ? { borderRadius: "full" } : {}),
          ...cssProp,
        }}
        {...rest}
      >
        {children}
      </Button>
    );
  }
);
