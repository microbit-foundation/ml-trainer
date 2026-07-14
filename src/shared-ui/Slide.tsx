/**
 * (c) 2026, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { ReactNode } from "react";
import { css, cx } from "styled-system/css";
import { SystemStyleObject } from "styled-system/types";

export interface SlideProps {
  /** Slides in when true; sits translated offscreen when false. */
  isOpen: boolean;
  /** Per-instance style overrides (e.g. zIndex), merged after the base. */
  css?: SystemStyleObject;
  className?: string;
  children: ReactNode;
}

/**
 * Slide — Chakra's Slide transition, bottom edge only (add other directions
 * when a use appears): a full-width panel pinned to the viewport bottom,
 * translated offscreen when closed. Content stays mounted throughout, so
 * closing doesn't drop in-flight state and the exit animates.
 */
export const Slide = ({
  isOpen,
  css: cssProp,
  className,
  children,
}: SlideProps) => (
  <div
    data-open={isOpen ? "" : undefined}
    className={cx(
      css(
        {
          position: "fixed",
          left: 0,
          right: 0,
          bottom: 0,
          transform: "translateY(100%)",
          "&[data-open]": { transform: "translateY(0)" },
          transitionProperty: "transform",
          transitionDuration: "0.25s",
          transitionTimingFunction: "cubic-bezier(0, 0, 0.2, 1)",
          _motionReduce: { transition: "none" },
        },
        cssProp
      ),
      className
    )}
  >
    {children}
  </div>
);
