/**
 * (c) 2026, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { SystemStyleObject } from "../../shared-ui";

/**
 * Styling shared by the action-bar icon-button menu triggers (settings, help):
 * a 48px circular white glyph on the brand header, with the dark focus ring.
 * Applied via the shared-ui IconButton `css` prop (which supplies `px: 0` and
 * the round radius).
 *
 * @param hidden When true the trigger is removed from layout (used to hide it at
 * the native tablet breakpoint, where the drawer takes over).
 */
export const actionBarMenuButtonCss = (hidden?: boolean): SystemStyleObject => ({
  display: hidden ? "none" : undefined,
  color: "white",
  h: 12,
  w: 12,
  minW: 12,
  _focusVisible: { boxShadow: "outlineDark" },
});
