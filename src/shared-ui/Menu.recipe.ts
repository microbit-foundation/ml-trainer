/**
 * (c) 2026, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { defineSlotRecipe } from "@pandacss/dev";

/**
 * Menu slot recipe — Chakra's default Menu parts (light mode). `content` is the
 * dropdown card (react-aria-components' Popover), `list` the RAC Menu, `item` a
 * MenuItem, `icon` the leading-icon wrapper.
 *
 * A config slot recipe (rather than an atomic `sva`) for consistency with
 * `dialog` and so presets can override it later if brands diverge.
 * No variants, so it needs no `staticCss` entry.
 *
 * Registered in `src/deployment/default/panda-preset.ts`.
 */
export const menu = defineSlotRecipe({
  className: "menu",
  slots: ["content", "list", "item", "icon", "label", "divider"],
  base: {
    content: {
      bg: "white",
      color: "inherit",
      minWidth: "3xs",
      py: "2",
      zIndex: "dropdown",
      borderRadius: "md",
      borderWidth: "1px",
      borderColor: "gray.200",
      boxShadow: "sm",
      // Approximate Chakra's menu fade/scale. RAC toggles data-entering/
      // data-exiting on the Popover and waits for the transition before unmount.
      transformOrigin: "top",
      opacity: 1,
      transform: "scale(1)",
      transition: "opacity 0.1s ease-out, transform 0.1s ease-out",
      "&[data-entering]": { opacity: 0, transform: "scale(0.95)" },
      "&[data-exiting]": { opacity: 0, transform: "scale(0.95)" },
      _motionReduce: { transition: "none" },
    },
    list: {
      outline: "none",
    },
    item: {
      display: "flex",
      alignItems: "center",
      py: "1.5",
      px: "3",
      cursor: "pointer",
      color: "inherit",
      textDecoration: "none",
      outline: "none",
      transitionProperty: "background",
      transitionDuration: "ultra-fast",
      transitionTimingFunction: "ease-in",
      // RAC highlights the active item (keyboard or pointer) with data-focused;
      // data-pressed is the pressed state — mirrors Chakra's _focus/_active.
      "&[data-focused]": { bg: "gray.100" },
      "&[data-pressed]": { bg: "gray.200" },
      "&[data-disabled]": { opacity: 0.4, cursor: "not-allowed" },
    },
    label: {
      // Chakra wraps an icon-item's children in a flex:1 span, so block
      // children (e.g. two stacked <Text>s) lay out vertically rather than as
      // flex-row siblings of the icon.
      flex: "1",
    },
    icon: {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0,
      marginEnd: "0.75rem",
      // Chakra's MenuIcon shrinks glyphs to 0.8em; items passing an explicitly
      // sized icon (e.g. h/w) override this.
      fontSize: "0.8em",
    },
    divider: {
      border: 0,
      borderBottom: "1px solid",
      borderColor: "gray.200",
      my: "2",
      opacity: 0.6,
    },
  },
});
