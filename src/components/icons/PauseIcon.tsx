/**
 * (c) 2026, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { css } from "@microbit/ui";

/** Pause glyph sized like a shared-ui Icon (1em, currentColor). */
const PauseIcon = () => {
  return (
    <svg
      viewBox="0 0 163 163"
      aria-hidden
      className={css({
        width: "1em",
        height: "1em",
        display: "inline-block",
        flexShrink: 0,
        fill: "currentColor",
      })}
    >
      <rect x="50" y="35" width="20" height="93" fill="currentColor" />
      <rect x="92" y="35" width="20" height="93" fill="currentColor" />
    </svg>
  );
};

export default PauseIcon;
