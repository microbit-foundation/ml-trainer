/**
 * (c) 2026, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { useEffect, useRef } from "react";

/**
 * Runs its callback when unmounted. RAC keeps an overlay tree mounted until
 * the exit transition finishes, so mounting this inside a Modal/Drawer gives
 * the equivalent of Chakra's `onCloseComplete`. Internal to shared-ui.
 */
export const UnmountCallback = ({ callback }: { callback?: () => void }) => {
  const ref = useRef(callback);
  ref.current = callback;
  useEffect(() => () => ref.current?.(), []);
  return null;
};
