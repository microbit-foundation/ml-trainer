/**
 * (c) 2026, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { forwardRef, HTMLAttributes } from "react";
import { css, cx } from "styled-system/css";
import { card, CardVariantProps } from "styled-system/recipes";
import { SystemStyleObject } from "styled-system/types";

export interface CardProps
  extends HTMLAttributes<HTMLDivElement>,
    CardVariantProps {
  /** Per-instance style overrides, merged after the recipe. */
  css?: SystemStyleObject;
}

/**
 * Card — Chakra's <Card> equivalent (md size). Place a CardBody inside.
 */
export const Card = forwardRef<HTMLDivElement, CardProps>(function Card(
  { variant, css: cssProp, className, ...rest },
  ref
) {
  return (
    <div
      ref={ref}
      className={cx(
        card({ variant }).container,
        cssProp ? css(cssProp) : undefined,
        className
      )}
      {...rest}
    />
  );
});

export interface CardBodyProps extends HTMLAttributes<HTMLDivElement> {
  css?: SystemStyleObject;
}

export const CardBody = forwardRef<HTMLDivElement, CardBodyProps>(
  function CardBody({ css: cssProp, className, ...rest }, ref) {
    return (
      <div
        ref={ref}
        className={cx(
          card({}).body,
          cssProp ? css(cssProp) : undefined,
          className
        )}
        {...rest}
      />
    );
  }
);
