/**
 * (c) 2026, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { useEffect, useState } from "react";

// Min-width breakpoints, matching the token scale in the Panda preset (Chakra
// defaults). Kept local so shared-ui has no dependency on the deployment theme.
const BREAKPOINTS = {
  sm: "30em",
  md: "48em",
  lg: "62em",
  xl: "80em",
  "2xl": "96em",
} as const;

type Breakpoint = "base" | keyof typeof BREAKPOINTS;

const ORDER: Breakpoint[] = ["base", "sm", "md", "lg", "xl", "2xl"];

const activeBreakpoint = (): Breakpoint => {
  let current: Breakpoint = "base";
  for (const [name, min] of Object.entries(BREAKPOINTS)) {
    if (window.matchMedia(`(min-width: ${min})`).matches) {
      current = name as Breakpoint;
    }
  }
  return current;
};

/**
 * JS-side responsive value resolver, replacing Chakra's `useBreakpointValue`.
 * Panda handles responsive *styles* in CSS; this is for responsive *logic*
 * (choosing a prop value, branching behaviour). Resolves to the value at the
 * active breakpoint, falling back to the nearest smaller one that is defined.
 */
export function useBreakpointValue<T>(
  values: Partial<Record<Breakpoint, T>>
): T | undefined {
  const [bp, setBp] = useState<Breakpoint>(() =>
    typeof window === "undefined" ? "base" : activeBreakpoint()
  );

  useEffect(() => {
    const update = () => setBp(activeBreakpoint());
    update();
    const lists = Object.values(BREAKPOINTS).map((min) =>
      window.matchMedia(`(min-width: ${min})`)
    );
    lists.forEach((l) => l.addEventListener("change", update));
    return () => lists.forEach((l) => l.removeEventListener("change", update));
  }, []);

  for (let i = ORDER.indexOf(bp); i >= 0; i--) {
    const value = values[ORDER[i]];
    if (value !== undefined) {
      return value;
    }
  }
  return undefined;
}
