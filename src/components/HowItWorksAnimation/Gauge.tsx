/**
 * (c) 2026, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { Box, HStack, keyframes, StackProps } from "@chakra-ui/react";
import { forwardRef, useImperativeHandle, useMemo, useState } from "react";
import { useAnimation } from "../AnimationProvider";

export const totalDuration = 2;

export interface GaugeProps extends StackProps {
  empty?: string;
  filled?: string;
  filledDark?: string;
}

export interface GaugeRef {
  play(duration?: number): Promise<void>;
  reset(): void;
}

const filledDarkPct = "75%";
export const buildIconColorKeyframes = (from: string, to: string) => {
  return keyframes({
    "0%": { color: from },
    "74%": { color: from },
    [filledDarkPct]: { color: to },
    "100%": { color: to },
  });
};
function buildKeyframes(empty: string, filled: string, filledDark: string) {
  return [
    keyframes({
      "0%": { background: empty },
      "6.8%": { background: filled },
      "71.2%": { background: filled },
      [filledDarkPct]: { background: filledDark },
      "100%": { background: filledDark },
    }),
    keyframes({
      "0%": { background: empty },
      "15.6%": { background: empty },
      "22.4%": { background: filled },
      "71.2%": { background: filled },
      [filledDarkPct]: { background: filledDark },
      "100%": { background: filledDark },
    }),
    keyframes({
      "0%": { background: empty },
      "24.4%": { background: empty },
      "31.2%": { background: filled },
      "71.2%": { background: filled },
      [filledDarkPct]: { background: filledDark },
      "100%": { background: filledDark },
    }),
    keyframes({
      "0%": { background: empty },
      "33.2%": { background: empty },
      "42.4%": { background: filled },
      "51.2%": { background: empty },
      "60%": { background: filled },
      "71.2%": { background: filled },
      [filledDarkPct]: { background: filledDark },
      "100%": { background: filledDark },
    }),
    keyframes({
      "0%": { background: empty },
      [filledDarkPct]: { background: empty },
      "76%": { background: filledDark },
      "100%": { background: filledDark },
    }),
    keyframes({
      "0%": { background: empty },
      "90%": { background: empty },
      "100%": { background: filledDark },
    }),
    keyframes({
      "0%": { background: empty },
      "100%": { background: empty },
    }),
  ];
}

const Gauge = forwardRef<GaugeRef, GaugeProps>(function Gauge(
  { empty = "#CBD5E0", filled = "#718096", filledDark = "#48BB78", ...props },
  ref
) {
  const { delayInSec, withPlayState } = useAnimation();
  const [isPlaying, setIsPlaying] = useState(false);

  const segmentKeyframes = useMemo(
    () => buildKeyframes(empty, filled, filledDark),
    [empty, filled, filledDark]
  );

  useImperativeHandle(
    ref,
    () => ({
      async play(secs = totalDuration) {
        setIsPlaying(true);
        await delayInSec(secs);
      },
      reset() {
        setIsPlaying(false);
      },
    }),
    [delayInSec]
  );

  return (
    <HStack gap="0.1em" {...props}>
      {segmentKeyframes.map((kf, i) => (
        <Box
          key={i}
          w="0.5em"
          h="0.66em"
          background={empty}
          animation={
            isPlaying ? withPlayState(`${kf} ${totalDuration}s`) : undefined
          }
          roundedRight={i === segmentKeyframes.length - 1 ? "100%" : undefined}
          roundedLeft={i === 0 ? "100%" : undefined}
        />
      ))}
    </HStack>
  );
});

export default Gauge;
