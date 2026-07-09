/**
 * (c) 2026, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { forwardRef, ReactNode } from "react";
import {
  Button as RACButton,
  ButtonProps as RACButtonProps,
} from "react-aria-components";
import { css, cva, cx } from "styled-system/css";
import { button, ButtonVariantProps } from "styled-system/recipes";
import { SystemStyleObject } from "styled-system/types";

// Chakra's ButtonIcon: keeps the glyph centred and spaced from the label
// (iconSpacing 0.5rem).
const buttonIcon = cva({
  base: {
    display: "inline-flex",
    alignSelf: "center",
    flexShrink: 0,
  },
  variants: {
    side: {
      left: { marginEnd: "2" },
      right: { marginStart: "2" },
    },
  },
});

export interface ButtonProps
  extends Omit<RACButtonProps, "className" | "children">,
    ButtonVariantProps {
  /** Per-instance style overrides, merged after the recipe. */
  css?: SystemStyleObject;
  className?: string;
  /** Icon rendered before the label, matching Chakra's `leftIcon`. */
  leftIcon?: ReactNode;
  /** Icon rendered after the label, matching Chakra's `rightIcon`. */
  rightIcon?: ReactNode;
  children?: ReactNode;
}

/**
 * Button — react-aria-components <Button> styled with the `button` config
 * recipe. The recipe's interaction states are driven by RAC's data attributes
 * (see the preset's widened conditions), so disabled/hover/press/focus all work
 * without extra wiring.
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    {
      variant,
      size,
      css: cssProp,
      className,
      leftIcon,
      rightIcon,
      children,
      ...rest
    },
    ref
  ) {
    return (
      <RACButton
        ref={ref}
        className={cx(
          button({ variant, size }),
          cssProp ? css(cssProp) : undefined,
          className
        )}
        {...rest}
      >
        {leftIcon ? (
          <span className={buttonIcon({ side: "left" })}>{leftIcon}</span>
        ) : null}
        {children}
        {rightIcon ? (
          <span className={buttonIcon({ side: "right" })}>{rightIcon}</span>
        ) : null}
      </RACButton>
    );
  }
);
