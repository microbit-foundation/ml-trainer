/**
 * (c) 2026, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { ReactNode } from "react";
import {
  Checkbox as RACCheckbox,
  CheckboxProps as RACCheckboxProps,
} from "react-aria-components";
import { css, cx } from "styled-system/css";
import { checkbox } from "styled-system/recipes";
import { SystemStyleObject } from "styled-system/types";

export interface CheckboxProps
  extends Omit<RACCheckboxProps, "className" | "children" | "style"> {
  /** Per-instance style overrides for the root, merged after the recipe. */
  css?: SystemStyleObject;
  className?: string;
  children?: ReactNode;
}

/**
 * Checkbox — react-aria-components <Checkbox> styled like Chakra's md
 * checkbox. Children render as the label; wrap them in a visually-hidden
 * span for icon-less checkboxes.
 */
export const Checkbox = ({
  css: cssProp,
  className,
  children,
  ...rest
}: CheckboxProps) => {
  const slots = checkbox();
  return (
    <RACCheckbox
      className={cx(slots.root, cssProp ? css(cssProp) : undefined, className)}
      {...rest}
    >
      {({ isSelected, isFocusVisible }) => (
        <>
          <span
            className={slots.control}
            data-selected={isSelected || undefined}
            data-focus-visible={isFocusVisible || undefined}
            aria-hidden
          >
            {isSelected && (
              <svg viewBox="0 0 12 10" className={slots.icon} aria-hidden>
                <polyline
                  points="1.5 6 4.5 9 10.5 1"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </span>
          {children}
        </>
      )}
    </RACCheckbox>
  );
};
