/**
 * (c) 2026, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { forwardRef, useImperativeHandle, useState } from "react";
import { Box, HStack, Svg, VStack } from "@microbit/ui";
import AnimationIcon, { AnimationIconProps } from "./AnimationIcon";
import { useAnimation } from "../AnimationProvider";

const starIconConfigs = [
  {
    size: "2em",
    top: "-50px",
    right: "10%",
    delay: 0,
  },
  {
    size: "0.75em",
    top: "-50px",
    right: "45%",
    delay: 1,
  },
  {
    size: "1em",
    top: "-30px",
    right: "45%",
    delay: 2,
  },
];

export interface ArrowRef {
  play(durationInSecs?: number): Promise<void>;
  reset(): void;
}

const Arrow = forwardRef<ArrowRef>(function Arrow(_, ref) {
  const { delayInSec, withPlayState } = useAnimation();
  const [visible, setVisible] = useState<boolean>(false);
  const [duration, setDuration] = useState<null | number>(null);
  useImperativeHandle(
    ref,
    () => {
      return {
        async play(durationInSecs = 2) {
          setVisible(true);
          setDuration(durationInSecs);
          await delayInSec(durationInSecs);
        },
        reset() {
          setVisible(false);
        },
      };
    },
    [delayInSec]
  );
  return (
    <VStack width="4em" height="100%" opacity={visible ? 1 : 0}>
      <Box position="relative" width="100%" height="100%">
        {starIconConfigs.map(({ size, delay, top, right }, i) => (
          <StarIcon
            key={i}
            css={{ position: "absolute", opacity: 0 }}
            // Sizes/positions/delays vary per star config; keep them inline.
            style={{
              width: size,
              height: size,
              top,
              right,
              animation: duration
                ? withPlayState(
                    `sparkle ${duration}s ease-in-out ${
                      delay * duration * 0.5
                    }s infinite`
                  )
                : undefined,
            }}
          />
        ))}
      </Box>
      <HStack width="100%" gap={0} justifyContent="end" overflow="hidden">
        {/* Arrow */}
        <Svg
          viewBox="0 0 81 21"
          fill="none"
          css={{ width: "100%", color: "brand.500" }}
          style={{
            animation: duration
              ? withPlayState(`arrowMove ${duration * 0.5}s linear infinite`)
              : undefined,
          }}
        >
          <path
            d="M10.4085 18.2546L2 10.3396L9.83549 1.99979"
            stroke="currentColor"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M2.745 10.0938H78.245"
            stroke="currentColor"
            strokeWidth="4"
            strokeLinecap="round"
          />
        </Svg>
      </HStack>
    </VStack>
  );
});

const StarIcon = (props: AnimationIconProps) => (
  <AnimationIcon
    viewBox="0 0 33 47"
    baseCss={{ fill: "none", color: "brand.500" }}
    {...props}
  >
    <path
      d="M32.6 23.1C32.6 23.4 32 24.1 28.3 24.6C24.8 25 20.4 26.1 18.3 37.9C18.3 37.9 17.6 46.1 16.3 46.1C15.1 46.1 14.3 37.9 14.3 37.9C12.3 26.1 7.9 25 4.3 24.6C0.6 24.2 0.1 23.4 0 23.1C0 22.7 0.6 22 4.3 21.5C7.8 21.1 12.2 20 14.3 8.2C14.4 8.2 15.1 0 16.3 0C17.5 0 18.3 8.2 18.3 8.2C20.3 20 24.7 21.1 28.3 21.5C32 21.9 32.5 22.7 32.6 23V23.1Z"
      fill="currentColor"
    />
  </AnimationIcon>
);

export default Arrow;
