/**
 * (c) 2026, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import {
  CSSProperties,
  forwardRef,
  useImperativeHandle,
  useState,
} from "react";
import { Box, HStack } from "@microbit/ui";
import { useAnimation } from "../AnimationProvider";

export const totalDuration = 2;

// The preset's gaugeSegment1..7 keyframes hold the timing profiles; only the
// colours vary per instance, so they come in via CSS custom properties.
const segmentCount = 7;

export interface GaugeProps {
  empty?: string;
  filled?: string;
  filledDark?: string;
}

export interface GaugeRef {
  play(duration?: number): Promise<void>;
  reset(): void;
}

const Gauge = forwardRef<GaugeRef, GaugeProps>(function Gauge(
  { empty = "#CBD5E0", filled = "#718096", filledDark = "#48BB78" },
  ref
) {
  const { delayInSec, withPlayState } = useAnimation();
  const [isPlaying, setIsPlaying] = useState(false);

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
    <HStack gap="0.1em">
      {Array.from({ length: segmentCount }, (_, i) => (
        <Box
          key={i}
          w={{ base: "0.32em", sm: "0.5em" }}
          h={{ base: "0.4em", sm: "0.66em" }}
          borderTopRightRadius={i === segmentCount - 1 ? "100%" : undefined}
          borderBottomRightRadius={i === segmentCount - 1 ? "100%" : undefined}
          borderTopLeftRadius={i === 0 ? "100%" : undefined}
          borderBottomLeftRadius={i === 0 ? "100%" : undefined}
          style={
            {
              background: empty,
              "--gauge-empty": empty,
              "--gauge-filled": filled,
              "--gauge-filled-dark": filledDark,
              animation: isPlaying
                ? withPlayState(`gaugeSegment${i + 1} ${totalDuration}s`)
                : undefined,
            } as CSSProperties
          }
        />
      ))}
    </HStack>
  );
});

export default Gauge;
