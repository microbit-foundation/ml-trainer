/**
 * (c) 2026, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { forwardRef, HTMLAttributes } from "react";
import { css, cx } from "styled-system/css";
import { SystemStyleObject } from "styled-system/types";

export interface ButtonGroupProps extends HTMLAttributes<HTMLDivElement> {
  /**
   * Square the inner radii so adjacent buttons form one control (Chakra's
   * `isAttached`). Otherwise buttons get a small gap.
   */
  isAttached?: boolean;
  /** Per-instance style overrides. */
  css?: SystemStyleObject;
  className?: string;
}

/**
 * ButtonGroup — lays out related buttons in a row. Works with any button
 * elements (shared-ui or native). Replaces Chakra's ButtonGroup.
 */
export const ButtonGroup = forwardRef<HTMLDivElement, ButtonGroupProps>(
  function ButtonGroup({ isAttached, css: cssProp, className, ...rest }, ref) {
    return (
      <div
        ref={ref}
        className={cx(
          css({ display: "inline-flex", alignItems: "center" }),
          isAttached
            ? css({
                gap: 0,
                // :first-child/:last-child, not :first-of-type: attached
                // groups can mix element types (e.g. select + button), and
                // -of-type matches per element type.
                "& > *:first-child:not(:last-child)": {
                  borderEndRadius: 0,
                },
                "& > *:not(:first-child):not(:last-child)": {
                  borderRadius: 0,
                },
                "& > *:not(:first-child):last-child": {
                  borderStartRadius: 0,
                },
              })
            : css({ gap: 2 }),
          cssProp ? css(cssProp) : undefined,
          className
        )}
        {...rest}
      />
    );
  }
);
