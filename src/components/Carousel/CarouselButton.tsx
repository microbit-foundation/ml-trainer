/**
 * (c) 2024, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import React from "react";
import { css, cx } from "../../shared-ui";
import ChevronLeftIcon from "../icons/ChevronLeftIcon";
import ChevronRightIcon from "../icons/ChevronRightIcon";

interface CarouselButtonProps {
  direction: "left" | "right";
  /** Which edge of the carousel the button is pinned to. */
  side: "left" | "right";
  onClick?: () => void;
  stroke?: string;
  "aria-hidden"?: boolean;
}

/**
 * Edge-pinned prev/next button overlaying the carousel. Spans from the
 * carousel's top padding to just above its bottom padding (drawing over the
 * card box shadows, hence the -8px).
 */
const CarouselButton = React.forwardRef(function CarouselButton(
  { direction, side, onClick, stroke, ...rest }: CarouselButtonProps,
  ref: React.ForwardedRef<HTMLButtonElement>
) {
  return (
    <button
      ref={ref}
      type="button"
      className={cx(
        css({
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          p: 0,
          border: "none",
          borderRadius: 0,
          bg: "rgba(245, 245, 245, 0.5)",
          cursor: "pointer",
          transition: "background-color 0.2s ease",
          w: "60px",
          position: "absolute",
          zIndex: 5,
          top: "var(--carousel-pt)",
          bottom: "calc(var(--carousel-pb) - 8px)",
          outline: "none",
          _hover: {
            bg: "rgb(245, 245, 245)",
            "& svg": { transform: "scale(1.2)" },
          },
          _focusVisible: {
            focusShadow: "outline",
          },
          "& svg": {
            objectFit: "contain",
            transition: "transform 0.2s ease",
            w: "30px",
            h: "30px",
          },
        }),
        side === "left"
          ? css({ left: 0, "& svg": { mr: "3px" } })
          : css({ right: 0, "& svg": { ml: "3px" } })
      )}
      onClick={onClick}
      {...rest}
    >
      {direction === "left" ? (
        <ChevronLeftIcon stroke={stroke} />
      ) : (
        <ChevronRightIcon stroke={stroke} />
      )}
    </button>
  );
});

export default CarouselButton;
