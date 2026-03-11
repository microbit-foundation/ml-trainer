/**
 * (c) 2026, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import {
  HStack,
  Icon,
  IconProps,
  keyframes,
  StackProps,
  Box,
  useBreakpointValue,
} from "@chakra-ui/react";
import { useImperativeHandle, forwardRef, useState, useMemo } from "react";
import { animations } from "./utils";
import { useAnimation } from "../AnimationProvider";

interface SignalProps extends StackProps {}
export interface SignalRef {
  playConnecting(): Promise<void>;
  playConnected(): Promise<void>;
  connected(): void;
  reset(): void;
  hide(): void;
}

// ─── Layout constants ────────────────────────────────────────────────────────
// Base dot sizing — scales down proportionally on small gaps
const BASE_DOT_SIZE = 7; // px at full gap
const BASE_DOT_GAP = 4; // px at full gap
const FULL_GAP = 270; // px — the largest signalGap value

// Travel group is always ~40% of total dots, minimum 3
const TRAVEL_DOT_RATIO = 0.2;

// ─── Gap-derived dot metrics ──────────────────────────────────────────────────
// Scale dot size + gap proportionally so dots shrink on small screens.
// Clamped: never go below 3px dot or 2px gap so they remain visible.
const dotMetricsForGap = (gap: number) => {
  const scale = Math.min(gap / FULL_GAP, 1);
  const dotSize = Math.max(Math.round(BASE_DOT_SIZE * scale), 3);
  const dotGap = Math.max(Math.round(BASE_DOT_GAP * scale), 2);
  return { dotSize, dotGap };
};

// ─── Derive dot count from gap ────────────────────────────────────────────────
// Fills the gap wall-to-wall: N × dotSize + (N-1) × dotGap = gap
// => N = (gap + dotGap) / (dotSize + dotGap)
const dotsForGap = (gap: number) => {
  const { dotSize, dotGap } = dotMetricsForGap(gap);
  return Math.floor((gap + dotGap) / (dotSize + dotGap));
};

// ─── Timing constants ────────────────────────────────────────────────────────
const signalFadeInDuration = 1;
const dotTravelDuration = 2;
const dotSettleDuration = 0.6;

// ─── Animation phases ────────────────────────────────────────────────────────
type Phase = "idle" | "entering" | "travelling" | "settling" | "settled";

// ─── Opacity helpers ─────────────────────────────────────────────────────────
const hiddenDotsEachSide = 5;
const travelEdgeOpacity: Record<number, number> = { 0: 0.1, 1: 0.35, 2: 0.65 };
const settledEdgeOpacity: Record<number, number> = {
  0: 0.1,
  1: 0.25,
  2: 0.45,
  3: 0.7,
};

const getTravelOpacity = (i: number, total: number): number => {
  const fromEdge = Math.min(i, total - 1 - i);
  if (fromEdge < hiddenDotsEachSide) return 0;
  const visIdx = i - hiddenDotsEachSide;
  const visEdge = Math.min(visIdx, total - hiddenDotsEachSide * 2 - 1 - visIdx);
  return travelEdgeOpacity[visEdge] ?? 1;
};

const getSettledOpacity = (i: number, total: number): number => {
  const fromEdge = Math.min(i, total - 1 - i);
  return settledEdgeOpacity[fromEdge] ?? 1;
};

// ─── Keyframes (gap-independent) ─────────────────────────────────────────────
const keyframeSignalEnter = `${keyframes({
  "0%": { opacity: 0, transform: "translate(0, 20px)" },
  "100%": { opacity: 1, transform: "translate(0, 0)" },
})} ${signalFadeInDuration}s ease-in-out forwards`;

// ─── Component ───────────────────────────────────────────────────────────────
const Signal = forwardRef<SignalRef, SignalProps>(function Signal(
  { ...props }: SignalProps,
  ref
) {
  const { delayInSec, withPlayState } = useAnimation();
  const [phase, setPhase] = useState<Phase>("idle");
  const [visible, setVisible] = useState<boolean>(false);

  const signalGap = useBreakpointValue({ base: 130, sm: 230, md: 230 }) ?? 230;

  // All dot metrics derived from the current gap
  const { dotSize, dotGap } = useMemo(
    () => dotMetricsForGap(signalGap),
    [signalGap]
  );

  // Total dots sized to exactly fill the gap when settled
  const totalNumDots = useMemo(() => dotsForGap(signalGap), [signalGap]);

  // Travel group: ~40% of total, minimum 3, kept odd so it centres cleanly
  const numTravelDots = useMemo(() => {
    const n = Math.max(3, Math.round(totalNumDots * TRAVEL_DOT_RATIO));
    return n % 2 === 0 ? n + 1 : n;
  }, [totalNumDots]);

  const travelDotsWidth =
    numTravelDots * dotSize + (numTravelDots - 1) * dotGap;

  // Extra clearance on each side so the travelling dots never touch the icons.
  const edgePadding = useBreakpointValue({ base: 30, sm: 50, md: 50 }) ?? 230;

  const travelOffset = useMemo(
    () => (signalGap - travelDotsWidth) / 2 - dotGap * 2 - edgePadding,
    [signalGap, travelDotsWidth, dotGap, edgePadding]
  );

  // Per-dot opacities — recalculated when totalNumDots changes
  const dotOpacities = useMemo(
    () =>
      Array.from({ length: totalNumDots }, (_, i) => {
        const travelOpacity = getTravelOpacity(i, totalNumDots);
        const settledOpacity = getSettledOpacity(i, totalNumDots);
        const settleAnimation = `${keyframes({
          "0%": { opacity: travelOpacity },
          "100%": { opacity: settledOpacity },
        })} ${dotSettleDuration}s ease-in-out forwards`;
        return { travelOpacity, settledOpacity, settleAnimation };
      }),
    [totalNumDots]
  );

  const keyframeTravellingDots = useMemo(
    () =>
      keyframes({
        "0%": { transform: `translateX(-${travelOffset}px)` },
        "38.46%": { transform: `translateX(${travelOffset}px)` },
        "76.92%": { transform: `translateX(-${travelOffset}px)` },
        "100%": { transform: `translateX(0px)` },
      }),
    [travelOffset]
  );

  useImperativeHandle(
    ref,
    () => ({
      async playConnecting() {
        setVisible(true);
        setPhase("entering");
        await delayInSec(signalFadeInDuration);
        setPhase("travelling");
        await delayInSec(dotTravelDuration);
      },
      async playConnected() {
        setVisible(true);
        setPhase("settling");
        await delayInSec(dotSettleDuration);
        setPhase("settled");
      },
      connected() {
        setVisible(true);
        setPhase("settled");
      },
      reset() {
        setPhase("idle");
        setVisible(false);
      },
      hide() {
        setVisible(false);
      },
    }),
    [delayInSec]
  );

  const dotsVisible = phase !== "idle" && phase !== "entering";

  return (
    <HStack
      alignItems="center"
      gap={`${signalGap}px`}
      position="relative"
      animation={
        !visible
          ? withPlayState(`${animations.fadeOut} 0.3s ease-in-out forwards`)
          : undefined
      }
      {...props}
    >
      <SignalIcon
        animation={
          phase === "entering" ? withPlayState(keyframeSignalEnter) : undefined
        }
      />

      {/* Dot layer — centred over the gap between the signal icons */}
      <Box
        position="absolute"
        left="50%"
        top="50%"
        transform="translate(-50%, -50%)"
        pointerEvents="none"
        width={`${signalGap}px`}
        height={`${dotSize}px`}
        display="flex"
        alignItems="center"
        justifyContent="center"
      >
        {dotsVisible && (
          <Box
            position="absolute"
            display="flex"
            alignItems="center"
            gap={`${dotGap}px`}
            animation={
              phase !== "settled"
                ? withPlayState(
                    `${keyframeTravellingDots} ${dotTravelDuration}s cubic-bezier(0.45, 0, 0.55, 1) forwards`
                  )
                : undefined
            }
            transform={
              phase !== "settled" ? `translateX(-${travelOffset}px)` : undefined
            }
          >
            {dotOpacities.map(
              ({ travelOpacity, settledOpacity, settleAnimation }, i) => (
                <Box
                  key={i}
                  borderRadius="full"
                  bg="brand2.500"
                  width={`${dotSize}px`}
                  height={`${dotSize}px`}
                  flexShrink={0}
                  opacity={phase === "settled" ? settledOpacity : travelOpacity}
                  animation={
                    phase === "settling"
                      ? withPlayState(settleAnimation)
                      : undefined
                  }
                />
              )
            )}
          </Box>
        )}
      </Box>

      <SignalIcon
        animation={
          phase === "entering" ? withPlayState(keyframeSignalEnter) : undefined
        }
      />
    </HStack>
  );
});

const SignalIcon = ({ ...props }: IconProps) => (
  <Icon
    viewBox="0 0 23.27 23.27"
    color="brand2.500"
    width={{ base: "1.5em", sm: "2em", md: "1.5em" }}
    height={{ base: "1.5em", sm: "2em", md: "1.5em" }}
    {...props}
  >
    <path
      fill="currentColor"
      d="M8.45,23.27c-.83,0-1.5-.67-1.5-1.5,0-3.01-2.45-5.45-5.45-5.45-.83,0-1.5-.67-1.5-1.5s.67-1.5,1.5-1.5c4.66,0,8.45,3.79,8.45,8.45,0,.83-.67,1.5-1.5,1.5Z"
    />
    <path
      fill="currentColor"
      d="M15.06,23.27c-.83,0-1.5-.67-1.5-1.5,0-6.65-5.41-12.06-12.06-12.06-.83,0-1.5-.67-1.5-1.5s.67-1.5,1.5-1.5c8.3,0,15.06,6.76,15.06,15.06,0,.83-.67,1.5-1.5,1.5Z"
    />
    <path
      fill="currentColor"
      d="M21.77,23.27c-.83,0-1.5-.67-1.5-1.5C20.27,11.42,11.85,3,1.5,3c-.83,0-1.5-.67-1.5-1.5S.67,0,1.5,0c12.01,0,21.77,9.77,21.77,21.77,0,.83-.67,1.5-1.5,1.5Z"
    />
  </Icon>
);

export default Signal;
