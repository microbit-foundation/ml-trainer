/**
 * (c) 2026, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { RefObject, useLayoutEffect, useState } from "react";

/**
 * Observed border-box size of an element, or undefined before first measure.
 * Replaces Chakra's useSize.
 *
 * Measures synchronously in a layout effect (like Chakra's) so consumers
 * re-render with the real size before other effects run — LiveGraph relies on
 * its canvas having final dimensions before the chart paints its only frame.
 */
export const useElementSize = (
  ref: RefObject<HTMLElement>
): { width: number; height: number } | undefined => {
  const [size, setSize] = useState<
    { width: number; height: number } | undefined
  >(undefined);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) {
      return;
    }
    const measure = () => {
      const rect = el.getBoundingClientRect();
      setSize({ width: rect.width, height: rect.height });
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [ref]);
  return size;
};
