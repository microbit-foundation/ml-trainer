/**
 * (c) 2026, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { CSSProperties } from "react";
import { Svg, SystemStyleObject } from "../../shared-ui";

interface TickProps {
  /** Per-instance style overrides, merged after the base. */
  css?: SystemStyleObject;
  style?: CSSProperties;
}

const Tick = ({ css: cssProp, style }: TickProps) => {
  return (
    <Svg
      viewBox="0 0 24 17.1"
      css={{ color: "brand2.500", ...cssProp }}
      style={style}
    >
      <path
        fill="currentColor"
        d="M9.2,17.1c-.6,0-1-.2-1.3-.5L.6,9.6c-.8-.8-.8-1.9,0-2.7.8-.8,1.9-.8,2.7,0l5.8,5.7L20.7.6c.8-.8,2-.8,2.7,0,.8.8.8,1.9,0,2.7l-12.9,13.3c-.4.3-.9.5-1.4.5"
      />
    </Svg>
  );
};

export default Tick;
