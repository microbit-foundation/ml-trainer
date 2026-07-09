/**
 * (c) 2026, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { forwardRef, InputHTMLAttributes } from "react";
import { css, cx } from "styled-system/css";
import { input } from "styled-system/recipes";
import { SystemStyleObject } from "styled-system/types";

export interface InputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "className"> {
  /** Per-instance style overrides, merged after the recipe. */
  css?: SystemStyleObject;
  className?: string;
}

/**
 * Input — a native input styled like Chakra's outline Input (md). For a
 * labelled field with help/error text use TextField instead.
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { css: cssProp, className, ...rest },
  ref
) {
  return (
    <input
      ref={ref}
      className={cx(input(), cssProp ? css(cssProp) : undefined, className)}
      {...rest}
    />
  );
});
