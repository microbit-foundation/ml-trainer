import { Box, HStack, keyframes, StackProps } from "@chakra-ui/react";
import { forwardRef, useImperativeHandle, useMemo, useState } from "react";
import { useAnimation } from "../AnimationProvider";

export const totalDuration = 2.5;
const pct = (s: number) => `${((s / totalDuration) * 100).toFixed(1)}%`;
const filledDarkPct = pct(1.94);

export interface AnimatedGaugeProps extends StackProps {
  empty?: string;
  filled?: string;
  filledDark?: string;
}

export interface AnimatedGaugeRef {
  play(duration?: number): Promise<void>;
  reset(): void;
}

export const buildIconColorKeyframes = (from: string, to: string) => {
  return keyframes({
    "0%": { color: from },
    [pct(1.9)]: { color: from },
    [filledDarkPct]: { color: to },
    "100%": { color: to },
  });
};

function buildKeyframes(empty: string, filled: string, filledDark: string) {
  return [
    keyframes({
      "0%": { background: empty },
      [pct(0.17)]: { background: filled },
      [pct(1.78)]: { background: filled },
      [filledDarkPct]: { background: filledDark },
      "100%": { background: filledDark },
    }),
    keyframes({
      "0%": { background: empty },
      [pct(0.39)]: { background: empty },
      [pct(0.56)]: { background: filled },
      [pct(1.78)]: { background: filled },
      [filledDarkPct]: { background: filledDark },
      "100%": { background: filledDark },
    }),
    keyframes({
      "0%": { background: empty },
      [pct(0.61)]: { background: empty },
      [pct(0.78)]: { background: filled },
      [pct(1.78)]: { background: filled },
      [filledDarkPct]: { background: filledDark },
      "100%": { background: filledDark },
    }),
    keyframes({
      "0%": { background: empty },
      [pct(0.83)]: { background: empty },
      [pct(1.06)]: { background: filled },
      [pct(1.28)]: { background: empty },
      [pct(1.5)]: { background: filled },
      [pct(1.78)]: { background: filled },
      [filledDarkPct]: { background: filledDark },
      "100%": { background: filledDark },
    }),
    keyframes({
      "0%": { background: empty },
      [filledDarkPct]: { background: empty },
      [pct(2.0)]: { background: filledDark },
      "100%": { background: filledDark },
    }),
    keyframes({
      "0%": { background: empty },
      [pct(2.17)]: { background: empty },
      "100%": { background: filledDark },
    }),
    keyframes({
      "0%": { background: empty },
      "100%": { background: empty },
    }),
  ];
}

const AnimatedGauge = forwardRef<AnimatedGaugeRef, AnimatedGaugeProps>(
  function AnimatedGauge(
    { empty = "#CBD5E0", filled = "#718096", filledDark = "#48BB78", ...props },
    ref
  ) {
    const { delayInSec } = useAnimation();
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
            animation={isPlaying ? `${kf} ${totalDuration}s` : undefined}
            roundedRight={
              i === segmentKeyframes.length - 1 ? "100%" : undefined
            }
            roundedLeft={i === 0 ? "100%" : undefined}
          />
        ))}
      </HStack>
    );
  }
);

export default AnimatedGauge;
