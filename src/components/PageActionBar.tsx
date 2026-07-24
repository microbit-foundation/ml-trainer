/**
 * (c) 2026, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { ReactNode } from "react";
import { HStack, SystemStyleObject } from "@microbit/ui";

interface PageActionBarProps {
  /** Accessible name for the region (jump target for AT users). */
  "aria-label": string;
  justify?: "space-between" | "right";
  /** Per-instance style overrides, merged after the base. */
  css?: SystemStyleObject;
  children: ReactNode;
}

/**
 * PageActionBar — the full-width primary-actions strip between a page's
 * heading area and content (3px gray.200 rules top and bottom), exposed as
 * an ARIA region.
 */
const PageActionBar = ({
  "aria-label": ariaLabel,
  justify = "space-between",
  css: cssProp,
  children,
}: PageActionBarProps) => (
  <HStack
    role="region"
    aria-label={ariaLabel}
    justifyContent={justify === "right" ? "right" : "space-between"}
    px={5}
    py={2}
    w="full"
    borderBottomWidth="3px"
    borderTopWidth="3px"
    borderStyle="solid"
    borderColor="gray.200"
    alignItems="center"
    css={cssProp}
  >
    {children}
  </HStack>
);

export default PageActionBar;
