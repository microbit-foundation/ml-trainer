/**
 * (c) 2026, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { defineRecipe, defineSlotRecipe } from "@pandacss/dev";

// Chakra's transition.property.common, inlined (Panda has no transitionProperty
// token category). Matches Chakra's Button base transition.
const transitionCommon =
  "background-color, border-color, color, fill, stroke, opacity, box-shadow, transform";

/**
 * Button recipe — Chakra's default Button base + sizes, with this app's
 * borderRadius (`button` = 2rem) and variant set ported from
 * `components/button.ts`. Interaction conditions (`_hover`/`_active`/
 * `_disabled`/`_focusVisible`) are widened in the preset to also match
 * react-aria-components' data attributes, so these Chakra-shaped variant
 * objects work unchanged on RAC's <Button>.
 *
 * A config recipe (not a component cva) so the private theme preset can
 * override brand-specific variants (e.g. `language`).
 */
export const button = defineRecipe({
  className: "btn",
  jsx: ["Button", "IconButton"],
  base: {
    lineHeight: "1.2",
    borderRadius: "button",
    fontWeight: "semibold",
    transitionProperty: transitionCommon,
    transitionDuration: "normal",
    display: "inline-flex",
    appearance: "none",
    alignItems: "center",
    justifyContent: "center",
    userSelect: "none",
    position: "relative",
    whiteSpace: "nowrap",
    verticalAlign: "middle",
    outline: "none",
    _focusVisible: {
      boxShadow: "outline",
    },
    _disabled: {
      opacity: 0.4,
      cursor: "not-allowed",
      boxShadow: "none",
    },
    _hover: {
      _disabled: {
        bg: "initial",
      },
    },
  },
  variants: {
    size: {
      lg: { h: "12", minW: "12", fontSize: "lg", px: "6" },
      md: { h: "10", minW: "10", fontSize: "md", px: "4" },
      sm: { h: "8", minW: "8", fontSize: "sm", px: "3" },
      xs: { h: "6", minW: "6", fontSize: "xs", px: "2" },
    },
    variant: {
      // Chakra's unstyled reset + this app's border-radius removal.
      unstyled: {
        bg: "none",
        color: "inherit",
        display: "inline",
        lineHeight: "inherit",
        m: "0",
        p: "0",
        borderRadius: "unset",
      },
      // Chakra's link layout (no padding/height) + this app's colours.
      link: {
        padding: 0,
        height: "auto",
        lineHeight: "normal",
        verticalAlign: "baseline",
        borderWidth: "0",
        color: "brand.600",
        fontWeight: "normal",
        bg: "transparent",
        _hover: {
          textDecoration: "underline",
        },
      },
      secondary: {
        borderWidth: "2px",
        borderColor: "brand.500",
        color: "brand.700",
        bg: "transparent",
        _hover: { borderColor: "brand.600" },
        _active: { bg: "brand.50", borderColor: "brand.700" },
      },
      led: {
        borderWidth: "2px",
        borderRadius: "5px",
        borderColor: "brand2.500",
        color: "brand2.700",
        bg: "transparent",
        _hover: { cursor: "pointer", borderColor: "brand2.500" },
        _active: { bg: "brand2.500", borderColor: "brand2.500" },
      },
      ghost: {
        color: "black",
        bg: "transparent",
        _hover: { bg: "blackAlpha.50" },
        _active: { bg: "blackAlpha.100" },
      },
      // Chakra had no `plain` variant, so `variant="plain"` fell through to
      // base-only styling: a transparent, colour-inheriting button. Used for the
      // action-bar icon-button menu triggers (settings/help), which supply their
      // own colour and shape via instance styles.
      plain: {
        bg: "transparent",
        color: "inherit",
      },
      primary: {
        color: "white",
        bg: "brand.500",
        _hover: { bg: "brand.600", _disabled: { bg: "brand.500" } },
        _active: { bg: "brand.700" },
      },
      recordOutline: {
        borderWidth: "1px",
        borderColor: "red.500",
        color: "red.500",
        bg: "transparent",
        _hover: { bg: "red.50" },
        _active: { borderColor: "red.600", color: "red.600", bg: "red.100" },
      },
      record: {
        color: "white",
        bg: "red.500",
        _hover: { bg: "red.600", _disabled: { bg: "red.500" } },
        _active: { bg: "red.700" },
      },
      warning: {
        borderWidth: "2px",
        borderColor: "red.500",
        color: "red.500",
        bg: "transparent",
        _hover: { borderColor: "red.600" },
        _active: { bg: "red.50", borderColor: "red.500" },
      },
      toolbar: {
        color: "black",
        bg: "white",
        _hover: { bg: "whiteAlpha.900", _disabled: { bg: "white" } },
        _active: { bg: "whiteAlpha.800" },
        _focusVisible: { boxShadow: "outlineDark" },
      },
      language: {
        borderWidth: "2px",
        borderColor: "gray.200",
        color: "languageText",
        _hover: { color: "languageTextHover", bg: "gray.100" },
      },
      "secondary-disabled": {
        borderWidth: "2px",
        borderColor: "brand.500",
        color: "brand.700",
        bg: "transparent",
        opacity: "0.4",
      },
    },
  },
  defaultVariants: {
    variant: "secondary",
    size: "md",
  },
});

/**
 * Heading recipe — Chakra's default Heading base + responsive sizes.
 * A config recipe so the private preset can add brand variants (e.g.
 * `marketing` with the brand display font).
 */
export const heading = defineRecipe({
  className: "heading",
  jsx: ["Heading"],
  base: {
    fontFamily: "heading",
    fontWeight: "bold",
  },
  variants: {
    size: {
      "4xl": { fontSize: { base: "6xl", md: "7xl" }, lineHeight: 1 },
      "3xl": { fontSize: { base: "5xl", md: "6xl" }, lineHeight: 1 },
      "2xl": {
        fontSize: { base: "4xl", md: "5xl" },
        lineHeight: { base: 1.2, md: 1 },
      },
      xl: {
        fontSize: { base: "3xl", md: "4xl" },
        lineHeight: { base: 1.33, md: 1.2 },
      },
      lg: {
        fontSize: { base: "2xl", md: "3xl" },
        lineHeight: { base: 1.33, md: 1.2 },
      },
      md: { fontSize: "xl", lineHeight: 1.2 },
      sm: { fontSize: "md", lineHeight: 1.2 },
      xs: { fontSize: "sm", lineHeight: 1.2 },
    },
    // Brand marketing headings. The `display` font token is Helvetica in OSS and
    // GT Walsheim in the private preset.
    variant: {
      marketing: { fontFamily: "display" },
    },
  },
  defaultVariants: {
    size: "xl",
  },
});

/**
 * Dialog slot recipe — Chakra's default Modal parts (light mode), plus this
 * app's overrides: a full-viewport overlay (the iOS WKWebView 100% fix) and a
 * `full` size with safe-area insets and the brand status-bar gradient.
 *
 * A config recipe (rather than an atomic `sva`) so the `size` variant accepts
 * responsive values, e.g. `{ base: "full", md: "4xl" }`. Consumed by the
 * shared-ui Modal, which maps the slots onto react-aria-components'
 * ModalOverlay / Modal / Dialog.
 */
// Appearance of a normal (non-full) modal box. Restated by every non-full size
// variant so that, when `size` is responsive (e.g. { base: "full", md: "4xl" }),
// the larger breakpoint fully overrides the `full` variant rather than leaking
// its margin:0 / border-radius:0 / full-height / gradient into desktop. Panda
// applies the base-breakpoint variant value unconditionally, so symmetric
// property sets across size values are required.
const dialogBox = {
  my: "16",
  mx: "2",
  borderRadius: "md",
  background: "white",
  minHeight: "auto",
  padding: "0",
};

export const dialog = defineSlotRecipe({
  className: "dialog",
  slots: [
    "overlay",
    "content",
    "inner",
    "header",
    "body",
    "footer",
    "closeTrigger",
  ],
  base: {
    overlay: {
      position: "fixed",
      inset: 0,
      w: "100%",
      h: "100%",
      bg: "blackAlpha.600",
      zIndex: "modal",
      display: "flex",
      justifyContent: "center",
      alignItems: "flex-start",
      overflow: "auto",
      overscrollBehaviorY: "none",
      // Fade the backdrop in/out. RAC toggles data-entering/data-exiting and
      // waits for the transition before unmounting.
      opacity: 1,
      transition: "opacity 0.2s ease-out",
      "&[data-entering]": { opacity: 0 },
      "&[data-exiting]": { opacity: 0 },
      "@media (prefers-reduced-motion: reduce)": { transition: "none" },
    },
    content: {
      position: "relative",
      color: "inherit",
      boxShadow: "lg",
      width: "100%",
      display: "flex",
      flexDirection: "column",
      outline: "none",
      // Approximate Chakra's fade + scale enter/exit.
      opacity: 1,
      transform: "scale(1)",
      transition: "opacity 0.2s ease-out, transform 0.2s ease-out",
      "&[data-entering]": { opacity: 0, transform: "scale(0.95)" },
      "&[data-exiting]": { opacity: 0, transform: "scale(0.95)" },
      "@media (prefers-reduced-motion: reduce)": { transition: "none" },
    },
    inner: {
      outline: "none",
      display: "flex",
      flexDirection: "column",
      width: "100%",
    },
    header: {
      px: "6",
      py: "4",
      fontSize: "xl",
      fontWeight: "semibold",
      flexShrink: 0,
    },
    body: { px: "6", py: "2", flex: "1" },
    footer: {
      px: "6",
      py: "4",
      display: "flex",
      alignItems: "center",
      justifyContent: "flex-end",
      flexShrink: 0,
    },
    closeTrigger: { position: "absolute", top: "2", insetEnd: "3" },
  },
  variants: {
    size: {
      xs: { content: { ...dialogBox, maxWidth: "xs" } },
      sm: { content: { ...dialogBox, maxWidth: "sm" } },
      md: { content: { ...dialogBox, maxWidth: "md" } },
      lg: { content: { ...dialogBox, maxWidth: "lg" } },
      xl: { content: { ...dialogBox, maxWidth: "xl" } },
      "2xl": { content: { ...dialogBox, maxWidth: "2xl" } },
      "3xl": { content: { ...dialogBox, maxWidth: "3xl" } },
      "4xl": { content: { ...dialogBox, maxWidth: "4xl" } },
      "5xl": { content: { ...dialogBox, maxWidth: "5xl" } },
      "6xl": { content: { ...dialogBox, maxWidth: "6xl" } },
      full: {
        content: {
          maxWidth: "100vw",
          minHeight: "100dvh",
          my: "0",
          mx: "0",
          borderRadius: "0",
          paddingTop: "env(safe-area-inset-top)",
          paddingBottom: "env(safe-area-inset-bottom)",
          paddingLeft: "env(safe-area-inset-left)",
          paddingRight: "env(safe-area-inset-right)",
          // brand colour in the status-bar area, white below (matches ActionBar)
          background:
            "linear-gradient(to bottom, token(colors.brand2.500) env(safe-area-inset-top), white env(safe-area-inset-top))",
        },
        header: {
          pl: "calc(var(--window-controls-left, 0px) + token(spacing.6))",
        },
        body: { flex: "1", overflowY: "auto" },
        closeTrigger: {
          top: "calc(env(safe-area-inset-top) + token(spacing.2))",
        },
      },
    },
  },
  defaultVariants: { size: "md" },
});

/**
 * Menu slot recipe — Chakra's default Menu parts (light mode). `content` is the
 * dropdown card (react-aria-components' Popover), `list` the RAC Menu, `item` a
 * MenuItem, `icon` the leading-icon wrapper.
 *
 * A config slot recipe (rather than an atomic `sva`) for consistency with
 * `dialog` and so the private preset can override it later if brands diverge.
 * No variants, so it needs no `staticCss` entry.
 */
export const menu = defineSlotRecipe({
  className: "menu",
  slots: ["content", "list", "item", "icon", "divider"],
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
      "@media (prefers-reduced-motion: reduce)": { transition: "none" },
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
