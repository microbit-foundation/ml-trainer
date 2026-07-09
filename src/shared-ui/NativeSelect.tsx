/**
 * (c) 2026, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { forwardRef, SelectHTMLAttributes } from "react";
import { css, cx } from "styled-system/css";
import { input } from "styled-system/recipes";
import { SystemStyleObject } from "styled-system/types";

export interface NativeSelectProps
  extends Omit<SelectHTMLAttributes<HTMLSelectElement>, "className"> {
  /** Per-instance style overrides, merged after the recipe. */
  css?: SystemStyleObject;
  className?: string;
}

/**
 * NativeSelect — a native select styled like Chakra's Select field (md,
 * outline) without the chevron; add one back per call site if needed.
 */
export const NativeSelect = forwardRef<HTMLSelectElement, NativeSelectProps>(
  function NativeSelect({ css: cssProp, className, ...rest }, ref) {
    return (
      <select
        ref={ref}
        className={cx(
          input(),
          css({ cursor: "pointer" }),
          cssProp ? css(cssProp) : undefined,
          className
        )}
        {...rest}
      />
    );
  }
);
