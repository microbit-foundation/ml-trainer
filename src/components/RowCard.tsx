/**
 * (c) 2026, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { forwardRef } from "react";
import { Card, CardProps, css, cx } from "@microbit/ui";
import { SystemStyleObject } from "styled-system/types";

export interface RowCardProps extends Omit<CardProps, "css"> {
  /** Shows the brand selection border. */
  selected?: boolean;
  /** Per-instance style overrides, merged after the base. */
  css?: SystemStyleObject;
}

/**
 * RowCard — the 120px-high card shell shared by the data-samples table row
 * cards (action name, recordings, certainty). Always reserves a 1px border
 * so toggling `selected` doesn't shift layout.
 */
const RowCard = forwardRef<HTMLDivElement, RowCardProps>(function RowCard(
  { selected = false, css: cssProp, className, ...rest },
  ref
) {
  return (
    <Card
      ref={ref}
      className={cx(
        css(
          {
            px: 2,
            py: 2,
            h: "120px",
            display: "flex",
            flexDirection: "row",
            borderWidth: "1px",
            borderStyle: "solid",
            borderColor: selected ? "brand.500" : "transparent",
          },
          cssProp
        ),
        className
      )}
      {...rest}
    />
  );
});

export default RowCard;
