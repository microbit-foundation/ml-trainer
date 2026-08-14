/**
 * (c) 2021 - 2022, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { forwardRef } from "react";
import { MdMoreVert } from "react-icons/md";
import { Icon, IconButton, IconButtonProps } from "@microbit/ui";

/**
 * The "more options" half of an attached split button. Use as the trigger
 * inside a shared-ui MenuTrigger, alongside the split button's main action.
 */
const MoreMenuButton = forwardRef<
  HTMLButtonElement,
  Omit<IconButtonProps, "children">
>(function MoreMenuButton({ css: cssProp, ...props }, ref) {
  return (
    <IconButton
      ref={ref}
      css={{
        // The shorthand's implied currentColor matters: the divider reads
        // white on filled variants and red on recordOutline.
        borderLeft: "1px solid",
        ...cssProp,
      }}
      {...props}
    >
      <Icon
        as={MdMoreVert}
        css={{
          // The attached layout removes this button's left radius, so nudge
          // the glyph left to keep it optically centred.
          marginLeft: "calc(-0.15 * token(radii.button))",
        }}
      />
    </IconButton>
  );
});

export default MoreMenuButton;
