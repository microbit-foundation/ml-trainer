/**
 * (c) 2026, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { ButtonHTMLAttributes, forwardRef } from "react";
import { css, cx } from "styled-system/css";
import { styled } from "styled-system/jsx";
import { button } from "styled-system/recipes";
import { SystemStyleObject } from "styled-system/types";

/**
 * LinkBox — makes a whole box clickable via a nested LinkOverlay (or any
 * element with an inset `_before` overlay). Other interactive children must
 * be raised with `zIndex: 1`. Replaces Chakra's <LinkBox>.
 */
export const LinkBox = styled("div", {
  base: { position: "relative" },
});

/**
 * LinkOverlay — an anchor whose `::before` stretches over the nearest
 * LinkBox, making the whole box its hit area. For button-driven overlays,
 * apply the same `_before` inset style to a Button instead.
 */
export const LinkOverlay = styled("a", {
  base: {
    position: "static",
    _before: {
      content: '""',
      cursor: "inherit",
      display: "block",
      position: "absolute",
      top: 0,
      left: 0,
      zIndex: 0,
      width: "100%",
      height: "100%",
    },
  },
});

export interface LinkOverlayButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className"> {
  /** Per-instance style overrides, merged after the base. */
  css?: SystemStyleObject;
  className?: string;
}

/**
 * LinkOverlayButton — the button flavour of LinkOverlay: its `::before`
 * stretches over the nearest LinkBox so the whole box is clickable.
 *
 * Deliberately a plain button, not a react-aria one: react-aria's usePress
 * cancels presses that land outside the button's bounding rect, which defeats
 * the overlay. `position: static` overrides the button recipe's base so the
 * overlay anchors to the LinkBox (Chakra's LinkOverlay did the same over its
 * Button).
 */
export const LinkOverlayButton = forwardRef<
  HTMLButtonElement,
  LinkOverlayButtonProps
>(function LinkOverlayButton({ css: cssProp, className, ...rest }, ref) {
  return (
    <button
      ref={ref}
      type="button"
      className={cx(
        button({ variant: "unstyled" }),
        css({
          cursor: "pointer",
          position: "static",
          _before: {
            content: '""',
            cursor: "pointer",
            display: "block",
            position: "absolute",
            inset: 0,
            zIndex: 0,
          },
        }),
        cssProp ? css(cssProp) : undefined,
        className
      )}
      {...rest}
    />
  );
});
