/**
 * (c) 2024, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { forwardRef, memo, useImperativeHandle, useRef } from "react";
import { useIntl } from "react-intl";
import { AspectRatio, Box, css, cx, HStack, token, VStack } from "@microbit/ui";
import { icons, LedIconType } from "../utils/icons";

export interface LedIconHandle {
  /**
   * Toggle between the colorScheme color and gray without a React re-render.
   */
  setLedsOn(on: boolean): void;
}

interface LedIconProps {
  colorScheme?: string;
  icon: LedIconType;
  initiallyOn?: boolean;
  size?: string | number;
}

const LedIcon = forwardRef<LedIconHandle, LedIconProps>(
  ({ colorScheme = "brand", icon, initiallyOn = true, size = 20 }, ref) => {
    const iconData = icons[icon];
    const intl = useIntl();
    const vstackRef = useRef<HTMLDivElement>(null);
    // Runtime token lookup (the colour scheme is dynamic).
    const activeColor = token(
      `colors.${colorScheme}.500` as Parameters<typeof token>[0]
    );
    const offColor = token("colors.gray.600");

    useImperativeHandle(
      ref,
      () => ({
        setLedsOn(on: boolean) {
          vstackRef.current?.style.setProperty(
            "--led-color",
            on ? activeColor : offColor
          );
        },
      }),
      [activeColor, offColor]
    );

    return (
      <AspectRatio
        ratio={1}
        role="img"
        aria-label={intl.formatMessage({
          id: `led-icon-option-${icon.toLowerCase()}`,
        })}
        // Spacing-scale number (0.25rem units) or CSS length; dynamic, so an
        // inline style.
        style={{
          width: typeof size === "number" ? `${size * 0.25}rem` : size,
          height: typeof size === "number" ? `${size * 0.25}rem` : size,
        }}
      >
        <VStack
          w="100%"
          h="100%"
          gap={0.5}
          ref={vstackRef}
          style={
            {
              "--led-color": initiallyOn ? activeColor : offColor,
            } as React.CSSProperties
          }
        >
          {Array.from(Array(5)).map((_, idx) => {
            const start = idx * 5;
            return (
              <LedIconRow
                key={idx}
                data={iconData.substring(start, start + 5)}
              />
            );
          })}
        </VStack>
      </AspectRatio>
    );
  }
);

interface LedIconRowProps {
  data: string;
}

const LedIconRow = ({ data }: LedIconRowProps) => {
  return (
    <HStack w="100%" h="100%" gap={0.5}>
      {Array.from(Array(5)).map((_, idx) => (
        <Box
          h="100%"
          w="100%"
          key={idx}
          borderRadius="sm"
          transitionTimingFunction="ease"
          transitionProperty="background-color"
          transitionDuration="200ms"
          className={cx(
            data[idx] === "1"
              ? css({
                  bgColor: "var(--led-color)",
                  animation: "ledTurnOn 200ms ease",
                })
              : css({
                  bgColor: "gray.200",
                  animation: "ledTurnOff 200ms ease",
                })
          )}
        />
      ))}
    </HStack>
  );
};

LedIcon.displayName = "LedIcon";

export default memo(LedIcon);
