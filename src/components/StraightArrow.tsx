/**
 * (c) 2026, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { css, SystemStyleObject } from "@microbit/ui";

interface StraightArrowProps {
  /**
   * Merged into a single css() call so call-site overrides (e.g. size)
   * reliably win over the base styles.
   */
  css?: SystemStyleObject;
}

const StraightArrow = ({ css: cssProp }: StraightArrowProps) => {
  return (
    <svg
      viewBox="0 0 90 36"
      aria-hidden
      className={css({ w: "88px", h: "36px", flexShrink: 0 }, cssProp)}
    >
      <path
        d="M4.58415 18.4756H84.7559"
        fill="none"
        stroke="currentColor"
        strokeWidth={8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M72.0704 31.1611L84.7559 18.4756L72.0704 5.79009"
        fill="none"
        stroke="currentColor"
        strokeWidth={8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export default StraightArrow;
