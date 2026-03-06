import {
  HStack,
  Icon,
  IconProps,
  keyframes,
  StackProps,
  Box,
} from "@chakra-ui/react";
import { useImperativeHandle, forwardRef, useState } from "react";
import { animation } from "./utils";
import { useAnimation } from "../AnimationProvider";

interface SignalProps extends StackProps {}
export interface SignalRef {
  showConnecting(): Promise<void>;
  showConnected(): Promise<void>;
  reset(): void;
  hide(): void;
}

// ─── Layout constants ────────────────────────────────────────────────────────
const signalGap = 230; // px
const totalNumDots = 18;
const numTravelDots = 8;
const dotSize = 7; // px
const dotGap = 4; // px
const travelDotsWidth = numTravelDots * dotSize + (numTravelDots - 1) * dotGap;
const travelOffset = (signalGap - travelDotsWidth) / 2 - dotGap * 2;

// ─── Timing constants ────────────────────────────────────────────────────────
const signalFadeInDuration = 1; // s — icons slide up and fade in
const dotTravelDuration = 2.6; // s — dot group travels left → right → left → centre
const dotSettleDuration = 0.6; // s — each dot fades to its settled opacity

// ─── Animation phases ────────────────────────────────────────────────────────
type Phase =
  // idle - reset() can be called at any point to return here.
  | "idle"
  // entering - Signal icons slide up and fade in.
  | "entering"
  // travelling - Dots travel between the sign icons.
  | "travelling"
  // settling - Dots are centered and the outermost dots fade in.
  | "settling"
  // settled - Settle animation is complete.
  | "settled";

// ─── Opacity helpers ─────────────────────────────────────────────────────────
const hiddenDotsEachSide = 5;
const travelEdgeOpacity: Record<number, number> = { 0: 0.1, 1: 0.35, 2: 0.65 };
const settledEdgeOpacity: Record<number, number> = {
  0: 0.1,
  1: 0.25,
  2: 0.45,
  3: 0.7,
};

const getTravelOpacity = (i: number): number => {
  const fromEdge = Math.min(i, totalNumDots - 1 - i);
  if (fromEdge < hiddenDotsEachSide) return 0;
  const visIdx = i - hiddenDotsEachSide;
  const visEdge = Math.min(
    visIdx,
    totalNumDots - hiddenDotsEachSide * 2 - 1 - visIdx
  );
  return travelEdgeOpacity[visEdge] ?? 1;
};

const getSettledOpacity = (i: number): number => {
  const fromEdge = Math.min(i, totalNumDots - 1 - i);
  return settledEdgeOpacity[fromEdge] ?? 1;
};

const dotOpacities = Array.from({ length: totalNumDots }, (_, i) => {
  const travelOpacity = getTravelOpacity(i);
  const settledOpacity = getSettledOpacity(i);

  // Pre-bake the settle transition keyframe for each dot.
  // Defined here so it's a stable reference across all renders.
  const settleAnimation = `${keyframes({
    "0%": { opacity: travelOpacity },
    "100%": { opacity: settledOpacity },
  })} ${dotSettleDuration}s ease-in-out forwards`;

  return { travelOpacity, settledOpacity, settleAnimation };
});

// ─── Keyframes ───────────────────────────────────────────────────────────────
const keyframeSignalEnter = `${keyframes({
  "0%": { opacity: 0, transform: "translate(0, 20px)" },
  "100%": { opacity: 1, transform: "translate(0, 0)" },
})} ${signalFadeInDuration}s ease-in-out forwards`;

const keyframeTravellingDots = keyframes({
  "0%": { transform: `translateX(-${travelOffset}px)` },
  "38.46%": { transform: `translateX(${travelOffset}px)` },
  "76.92%": { transform: `translateX(-${travelOffset}px)` },
  "100%": { transform: `translateX(0px)` },
});

// ─── Component ───────────────────────────────────────────────────────────────
const Signal = forwardRef<SignalRef, SignalProps>(function Signal(
  { ...props }: SignalProps,
  ref
) {
  const { delayInSec } = useAnimation();
  const [phase, setPhase] = useState<Phase>("idle");
  const [visible, setVisible] = useState<boolean>(true);

  useImperativeHandle(
    ref,
    () => ({
      async showConnecting() {
        setPhase("entering");
        await delayInSec(signalFadeInDuration);

        setPhase("travelling");
        await delayInSec(dotTravelDuration);
      },
      async showConnected() {
        setPhase("settling");
        await delayInSec(dotSettleDuration);

        setPhase("settled");
      },
      reset() {
        setPhase("idle");
        setVisible(true);
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
        !visible ? `${animation.fadeOut} 0.3s ease-in-out forwards` : undefined
      }
      {...props}
    >
      <SignalIcon
        animation={phase !== "idle" ? keyframeSignalEnter : undefined}
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
            animation={`${keyframeTravellingDots} ${dotTravelDuration}s cubic-bezier(0.45, 0, 0.55, 1) forwards`}
            style={{ transform: `translateX(-${travelOffset}px)` }}
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
                  animation={phase === "settling" ? settleAnimation : undefined}
                />
              )
            )}
          </Box>
        )}
      </Box>

      <SignalIcon
        animation={phase !== "idle" ? keyframeSignalEnter : undefined}
      />
    </HStack>
  );
});

const SignalIcon = ({ ...props }: IconProps) => (
  <Icon
    viewBox="0 0 23.27 23.27"
    color="brand2.500"
    width={30}
    height={30}
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
