/**
 * (c) 2024, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import {
  AspectRatio,
  Box,
  HStack,
  keyframes,
  useToken,
  VStack,
} from "@chakra-ui/react";
import { forwardRef, memo, useImperativeHandle, useRef } from "react";
import { icons, LedIconType } from "../utils/icons";
import { useIntl } from "react-intl";

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
    const [activeColor, offColor] = useToken("colors", [
      `${colorScheme}.500`,
      "gray.600",
    ]);

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
        width={size}
        height={size}
        ratio={1}
        role="img"
        aria-label={intl.formatMessage({
          id: `led-icon-option-${icon.toLowerCase()}`,
        })}
      >
        <VStack
          w="100%"
          h="100%"
          spacing={0.5}
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

const turnOn = keyframes`
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.15);
  }
  100% {
    transform: scale(1);
  }
`;

const turnOff = keyframes`
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(0.8);
  }
  100% {
    transform: scale(1);
  }
`;

interface LedIconRowProps {
  data: string;
}

const LedIconRow = ({ data }: LedIconRowProps) => {
  const turnOnAnimation = `${turnOn} 200ms ease`;
  const turnOffAnimation = `${turnOff} 200ms ease`;

  return (
    <HStack w="100%" h="100%" spacing={0.5}>
      {Array.from(Array(5)).map((_, idx) => (
        <Box
          h="100%"
          w="100%"
          key={idx}
          bgColor={data[idx] === "1" ? "var(--led-color)" : "gray.200"}
          borderRadius="sm"
          transitionTimingFunction="ease"
          transitionProperty="background-color"
          transitionDuration="200ms"
          animation={data[idx] === "1" ? turnOnAnimation : turnOffAnimation}
        />
      ))}
    </HStack>
  );
};

LedIcon.displayName = "LedIcon";

export default memo(LedIcon);
