/**
 * (c) 2026, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import {
  Icon,
  IconProps,
  keyframes,
  StackProps,
  VStack,
  Heading,
} from "@chakra-ui/react";
import { forwardRef, useCallback, useImperativeHandle, useState } from "react";
import { useAnimation } from "../AnimationProvider";
import { MicrobitBoardBack } from "./MicrobitBoardBack";

const handPos = {
  // Start - hand is out of view.
  hidden: { right: "-50%", top: "25%" },
  // Ready - hand is ready to press reset button.
  ready: { right: "-17.5%", top: "5%" },
  // Press - hand is pressing reset button.
  press: { right: "-15%", top: "5%" },
};

// Durations in sec.
const durations = {
  move: 0.5,
  ready: 0.25,
  press: 0.2,
  pressing: 0.1,
};

type HandState = "hidden" | "moving" | "ready" | "pressDown" | "pressUp";

interface HandConfig extends IconProps {
  animation?: {
    kf: string;
    duration: number;
  };
}

const handConfig: Record<HandState, HandConfig> = {
  moving: {
    ...handPos.hidden,
    opacity: 0,
    animation: {
      kf: keyframes({
        "0%": { ...handPos.hidden, opacity: 0 },
        "10%": { opacity: 1 },
        "100%": { ...handPos.ready, opacity: 1 },
      }),
      duration: durations.move,
    },
  },
  hidden: { ...handPos.hidden, opacity: 0 },
  ready: { ...handPos.ready },
  pressDown: {
    ...handPos.ready,
    animation: {
      kf: keyframes({ from: handPos.ready, to: handPos.press }),
      duration: durations.press,
    },
  },
  pressUp: {
    ...handPos.ready,
    animation: {
      kf: keyframes({ from: handPos.press, to: handPos.ready }),
      duration: durations.press,
    },
  },
};

export interface ResetPressedMicrobitBoardRef {
  playPressed(count?: number): Promise<void>;
  reset(): void;
}
interface ResetPressedMicrobitBoardProps extends StackProps {
  activeColor: string;
}

const ResetPressedMicrobitBoard = forwardRef<
  ResetPressedMicrobitBoardRef,
  ResetPressedMicrobitBoardProps
>(function ResetHighlightedMicrobitBoard({ activeColor, ...props }, ref) {
  const { delayInSec, withPlayState } = useAnimation();
  const [showButtonOutline, setShowButtonOutline] = useState<boolean>(false);
  const [showGlowLines, setShowGlowLines] = useState<boolean>(false);
  const [handState, setHandState] = useState<HandState>("hidden");
  const [count, setCount] = useState<number | undefined>(undefined);

  const getHandProps = useCallback(
    (state: HandState): IconProps => {
      const cfg = handConfig[state];
      return {
        ...cfg,
        animation: cfg.animation
          ? withPlayState(
              `${cfg.animation.kf} ${cfg.animation.duration}s forwards`
            )
          : undefined,
      };
    },
    [withPlayState]
  );

  useImperativeHandle(
    ref,
    () => {
      return {
        async playPressed(countValue?) {
          if (handState === "hidden") {
            // Move hand to position.
            setShowButtonOutline(true);
            setHandState("moving");
            await delayInSec(durations.move);
            await delayInSec(durations.ready);
          }

          // Press down.
          setHandState("pressDown");
          await delayInSec(durations.press);

          // Pressing.
          setCount(countValue);
          setShowGlowLines(true);
          await delayInSec(durations.pressing);
          setShowGlowLines(false);

          // Press up.
          setHandState("pressUp");
          await delayInSec(durations.press);
          setHandState("ready");

          setCount(undefined)
        },

        reset() {
          setShowButtonOutline(false);
          setShowGlowLines(false);
          setHandState("hidden");
          setCount(undefined)
        },
      };
    },
    [delayInSec, handState]
  );

  return (
    <VStack position="relative" {...props}>
      {count && (
        <Heading
          variant="marketing"
          position="absolute"
          fontWeight="bold"
          fontSize="xl"
          color={activeColor}
          right="0"
          top="-30%"
        >
          {count}
        </Heading>
      )}
      <GlowLines
        position="absolute"
        boxSize="50%"
        right="7%"
        top="-14%"
        color={activeColor}
        opacity={showGlowLines ? 1 : 0}
      />
      <MicrobitBoardBack
        boxSize="100%"
        resetButtonStrokeColor={showButtonOutline ? activeColor : "transparent"}
      />
      <PointingHand
        position="absolute"
        boxSize="50%"
        {...getHandProps(handState)}
      />
    </VStack>
  );
});

const GlowLines = (props: IconProps) => {
  return (
    <Icon viewBox="0 0 79 79" fill="none" {...props}>
      <path
        d="M62.5439 29.8635L76.3897 24.0897"
        stroke="currentColor"
        strokeWidth="5"
        strokeMiterlimit="10"
        strokeLinecap="round"
      />
      <path
        d="M54.6934 2.50067L48.9873 16.3745"
        stroke="currentColor"
        strokeWidth="5"
        strokeMiterlimit="10"
        strokeLinecap="round"
      />
      <path
        d="M76.3897 24.0887L62.5439 29.8624"
        stroke="currentColor"
        strokeWidth="5"
        strokeMiterlimit="10"
        strokeLinecap="round"
      />
      <path
        d="M29.8634 16.418L24.0886 2.57333"
        stroke="currentColor"
        strokeWidth="5"
        strokeMiterlimit="10"
        strokeLinecap="round"
      />
      <path
        d="M2.50073 24.2697L16.3725 29.9757"
        stroke="currentColor"
        strokeWidth="5"
        strokeMiterlimit="10"
        strokeLinecap="round"
      />
      <path
        d="M16.4192 49.0998L2.57349 54.8735"
        stroke="currentColor"
        strokeWidth="5"
        strokeMiterlimit="10"
        strokeLinecap="round"
      />
      <path
        d="M24.2688 76.4612L29.9749 62.5894"
        stroke="currentColor"
        strokeWidth="5"
        strokeMiterlimit="10"
        strokeLinecap="round"
      />
    </Icon>
  );
};

const PointingHand = (props: IconProps) => {
  return (
    <Icon viewBox="0 0 110 95" fill="none" {...props}>
      <path
        d="M77.8407 5.85202L95.9213 24.2288C103.234 31.786 107.264 41.9264 107.135 52.4415C107.006 62.9566 102.727 72.9948 95.2311 80.3701C87.735 87.7453 77.6286 91.8602 67.1128 91.8186C56.5969 91.7769 46.5234 87.5822 39.086 80.1479L36.1055 77.1185C34.6367 75.6257 33.4763 73.8582 32.6906 71.917C31.905 69.9758 31.5093 67.8988 31.5263 65.8046C31.5433 63.7105 31.9727 61.6402 32.7898 59.712C33.6069 57.7838 34.7958 56.0354 36.2887 54.5667L28.4136 46.5617"
        fill="white"
      />
      <path
        d="M77.8407 5.85202L95.9213 24.2288C103.234 31.786 107.264 41.9264 107.135 52.4415C107.006 62.9566 102.727 72.9948 95.2311 80.3701C87.735 87.7453 77.6286 91.8602 67.1128 91.8186C56.5969 91.7769 46.5234 87.5822 39.086 80.1479L36.1055 77.1185C34.6367 75.6257 33.4763 73.8582 32.6906 71.917C31.905 69.9758 31.5093 67.8988 31.5263 65.8046C31.5433 63.7105 31.9727 61.6402 32.7898 59.712C33.6069 57.7838 34.7958 56.0354 36.2887 54.5667L28.4136 46.5617"
        stroke="#1D1D1B"
        strokeWidth="5"
        strokeMiterlimit="10"
        strokeLinecap="round"
      />
      <path
        d="M79.1961 7.22908L77.4519 5.45643C75.9688 3.94906 73.9477 3.09258 71.8331 3.0754C69.7186 3.05822 67.6838 3.88175 66.1765 5.36481C64.6691 6.84788 63.8126 8.869 63.7954 10.9836C63.7782 13.0981 64.6018 15.1329 66.0848 16.6403L66.2387 16.7986"
        fill="#C6C6C6"
      />
      <path
        d="M79.1961 7.22908L77.4519 5.45643C75.9688 3.94906 73.9477 3.09258 71.8331 3.0754C69.7186 3.05822 67.6838 3.88175 66.1765 5.36481C64.6691 6.84788 63.8126 8.869 63.7954 10.9836C63.7782 13.0981 64.6018 15.1329 66.0848 16.6403L66.2387 16.7986"
        fill="white"
      />
      <path
        d="M79.1961 7.22908L77.4519 5.45643C75.9688 3.94906 73.9477 3.09258 71.8331 3.0754C69.7186 3.05822 67.6838 3.88175 66.1765 5.36481C64.6691 6.84788 63.8126 8.869 63.7954 10.9836C63.7782 13.0981 64.6018 15.1329 66.0848 16.6403L66.2387 16.7986"
        stroke="#1D1D1B"
        strokeWidth="5"
        strokeMiterlimit="10"
        strokeLinecap="round"
      />
      <path
        d="M66.2416 16.7974L62.5246 13.019C61.0409 11.514 59.0204 10.6595 56.907 10.6434C54.7936 10.6273 52.7603 11.4508 51.2538 12.9331C49.7473 14.4153 48.8908 16.435 48.8726 18.5483C48.8544 20.6617 49.6759 22.6958 51.1566 24.2038L54.8745 27.9812"
        fill="white"
      />
      <path
        d="M66.2416 16.7974L62.5246 13.019C61.0409 11.514 59.0204 10.6595 56.907 10.6434C54.7936 10.6273 52.7603 11.4508 51.2538 12.9331C49.7473 14.4153 48.8908 16.435 48.8726 18.5483C48.8544 20.6617 49.6759 22.6958 51.1566 24.2038L54.8745 27.9812"
        stroke="#1D1D1B"
        strokeWidth="5"
        strokeMiterlimit="10"
        strokeLinecap="round"
      />
      <path
        d="M54.8746 27.9813L49.1821 22.1999C47.6942 20.7146 45.6799 19.8771 43.5775 19.8695C41.4751 19.8619 39.4548 20.685 37.9562 22.1595C36.4576 23.6341 35.602 25.6408 35.5756 27.743C35.5492 29.8453 36.354 31.8729 37.8151 33.3847L43.5075 39.166"
        fill="#C6C6C6"
      />
      <path
        d="M54.8746 27.9813L49.1821 22.1999C47.6942 20.7146 45.6799 19.8771 43.5775 19.8695C41.4751 19.8619 39.4548 20.685 37.9562 22.1595C36.4576 23.6341 35.602 25.6408 35.5756 27.743C35.5492 29.8453 36.354 31.8729 37.8151 33.3847L43.5075 39.166"
        fill="white"
      />
      <path
        d="M54.8746 27.9813L49.1821 22.1999C47.6942 20.7146 45.6799 19.8771 43.5775 19.8695C41.4751 19.8619 39.4548 20.685 37.9562 22.1595C36.4576 23.6341 35.602 25.6408 35.5756 27.743C35.5492 29.8453 36.354 31.8729 37.8151 33.3847L43.5075 39.166"
        stroke="#1D1D1B"
        strokeWidth="5"
        strokeMiterlimit="10"
        strokeLinecap="round"
      />
      <path
        d="M43.5075 39.1651L16.223 11.4323C14.7352 9.94675 12.7209 9.10888 10.6184 9.10107C8.51596 9.09326 6.49547 9.91615 4.99669 11.3907C3.49791 12.8652 2.64215 14.8719 2.61563 16.9743C2.58911 19.0766 3.39398 21.1043 4.85509 22.6162L49.6776 68.1707"
        fill="white"
      />
      <path
        d="M43.5075 39.1651L16.223 11.4323C14.7352 9.94675 12.7209 9.10888 10.6184 9.10107C8.51596 9.09326 6.49547 9.91615 4.99669 11.3907C3.49791 12.8652 2.64215 14.8719 2.61563 16.9743C2.58911 19.0766 3.39398 21.1043 4.85509 22.6162L49.6776 68.1707"
        stroke="#1D1D1B"
        strokeWidth="5"
        strokeMiterlimit="10"
        strokeLinecap="round"
      />
    </Icon>
  );
};

export default ResetPressedMicrobitBoard;
