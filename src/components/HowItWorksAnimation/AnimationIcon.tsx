/**
 * (c) 2026, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { CSSProperties, ReactNode } from "react";
import { Svg, SystemStyleObject } from "@microbit/ui";

/**
 * The props every glyph built on AnimationIcon exposes.
 */
export interface AnimationIconProps {
  /** Per-instance style overrides, merged after the icon's base styles. */
  css?: SystemStyleObject;
  style?: CSSProperties;
}

interface AnimationIconInternalProps extends AnimationIconProps {
  viewBox: string;
  /**
   * The icon's own styling (colour, sizing, `fill: "none"`). A style object
   * prop rather than individual colour/fill props because Panda only
   * generates CSS for values that are literals at the icon definition —
   * runtime prop values would silently produce no styles.
   */
  baseCss?: SystemStyleObject;
  children: ReactNode;
}

/**
 * AnimationIcon — shared shell for the HowItWorksAnimation glyphs: an Svg
 * taking `css`/`style` overrides merged after the icon's `baseCss`.
 */
const AnimationIcon = ({
  viewBox,
  baseCss,
  css: cssProp,
  style,
  children,
}: AnimationIconInternalProps) => (
  <Svg viewBox={viewBox} css={{ ...baseCss, ...cssProp }} style={style}>
    {children}
  </Svg>
);

export default AnimationIcon;
