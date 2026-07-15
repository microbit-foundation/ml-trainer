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
  /**
   * Suppress the dropdown chevron, e.g. when an adjacent control provides the
   * affordance. Without the chevron a bare <select> element is rendered (no
   * wrapper), so it can participate directly in e.g. an attached ButtonGroup.
   */
  hideChevron?: boolean;
  /** Per-instance style overrides, merged after the recipe. */
  css?: SystemStyleObject;
  className?: string;
}

/**
 * NativeSelect — a native select styled like Chakra's Select field (md,
 * outline). The recipe's `appearance: none` removes the platform chevron, so
 * one is drawn back in by default (Chakra Select's glyph, `currentColor`).
 */
export const NativeSelect = forwardRef<HTMLSelectElement, NativeSelectProps>(
  function NativeSelect(
    { hideChevron = false, css: cssProp, className, ...rest },
    ref
  ) {
    const select = (
      <select
        ref={ref}
        className={cx(
          input(),
          css(
            { cursor: "pointer" },
            // Room for the chevron overlay.
            hideChevron ? undefined : { paddingRight: "8" },
            cssProp
          ),
          className
        )}
        {...rest}
      />
    );
    if (hideChevron) {
      return select;
    }
    return (
      <span className={css({ position: "relative", display: "inline-flex" })}>
        {select}
        {/* Chakra Select's chevron. */}
        <svg
          viewBox="0 0 24 24"
          aria-hidden
          className={css({
            position: "absolute",
            right: "2",
            top: "50%",
            transform: "translateY(-50%)",
            width: "5",
            height: "5",
            pointerEvents: "none",
            fill: "currentColor",
          })}
        >
          <path d="M16.59 8.59 12 13.17 7.41 8.59 6 10l6 6 6-6z" />
        </svg>
      </span>
    );
  }
);
