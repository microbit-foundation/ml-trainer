/**
 * (c) 2026, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { ReactNode } from "react";
import {
  Switch as RACSwitch,
  SwitchProps as RACSwitchProps,
} from "react-aria-components";
import { css, cx } from "styled-system/css";
import { switchRecipe } from "styled-system/recipes";
import { SystemStyleObject } from "styled-system/types";

export interface SwitchProps
  extends Omit<RACSwitchProps, "className" | "children" | "style"> {
  /** Per-instance style overrides for the root, merged after the recipe. */
  css?: SystemStyleObject;
  className?: string;
  children?: ReactNode;
}

/**
 * Switch — react-aria-components <Switch> styled like Chakra's md switch.
 * Children render as the label; pass `aria-label` for label-less switches.
 */
export const Switch = ({
  css: cssProp,
  className,
  children,
  ...rest
}: SwitchProps) => {
  const slots = switchRecipe();
  return (
    <RACSwitch
      className={cx(slots.root, cssProp ? css(cssProp) : undefined, className)}
      {...rest}
    >
      {({ isSelected, isFocusVisible, isDisabled }) => {
        const state = {
          "data-selected": isSelected || undefined,
          "data-focus-visible": isFocusVisible || undefined,
          "data-disabled": isDisabled || undefined,
        };
        return (
          <>
            <span className={slots.track} {...state} aria-hidden>
              <span className={slots.thumb} {...state} />
            </span>
            {children != null && (
              <span className={slots.label} {...state}>
                {children}
              </span>
            )}
          </>
        );
      }}
    </RACSwitch>
  );
};
