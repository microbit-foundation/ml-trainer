/**
 * (c) 2026, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { Icon, keyframes, Stack, StackProps, useToken } from "@chakra-ui/react";
import { forwardRef, useImperativeHandle, useState } from "react";
import { icons, LedIconType, Off } from "../../utils/icons";
import { useAnimation } from "../AnimationProvider";
import CrossLedIcon from "./CrossLedIcon";
import HeartLedIcon from "./HeartLedIcon";

type MoveType = "still" | "wave" | "bob";

const animationKeyframes = {
  wave: keyframes({
    "0%": { transform: "rotate(12deg)" },
    "25%": { transform: "rotate(-10deg)" },
    "50%": { transform: "rotate(10deg)" },
    "75%": { transform: "rotate(-7deg)" },
    "100%": { transform: "rotate(12deg)" },
  }),
  bob: keyframes({
    "0%": { transform: "translateY(0px)" },
    "25%": { transform: "translateY(-20px)" },
    "50%": { transform: "translateY(0px)" },
    "75%": { transform: "translateY(-20px)" },
    "100%": { transform: "translateY(0px)" },
  }),
};

const sparkle = keyframes({
  "0%, 100%": {
    transform: "scale(0.8)",
    opacity: 0,
  },
  "50%": {
    transform: "scale(1)",
    opacity: 1,
  },
});

type BackgroundMode = "default" | "sparkly-heart" | "sparkly-cross";

interface PlayOption {
  ledPattern?: LedIconType;
  move?: MoveType;
  backgroundMode?: BackgroundMode;
  duration: number; // sec
}

const defaultShowOption: PlayOption = {
  ledPattern: "off",
  move: "still",
  backgroundMode: "default",
  duration: 1,
};

interface MicrobitOnWristProps extends StackProps {}

export interface MicrobitOnWristRef {
  play(option?: PlayOption): Promise<void>;
  reset(): void;
  setMove(type: MoveType): void;
}

const MicrobitOnWrist = forwardRef<MicrobitOnWristRef, MicrobitOnWristProps>(
  function MicrobitOnWrist({ ...props }: MicrobitOnWristProps, ref) {
    const [litLedColor, unlitLedColor] = useToken("colors", [
      "pink.500",
      "gray.500",
    ]);
    const { withPlayState, delayInSec } = useAnimation();
    const [ledPattern, setLedPattern] = useState<string>(Off);
    const [move, setMove] = useState<MoveType>("still");
    const [backgroundMode, setMode] = useState<BackgroundMode>("default");

    const [visible, setVisible] = useState<boolean>(false);
    useImperativeHandle(
      ref,
      () => {
        return {
          setLedPattern,
          async play(option) {
            const config = { ...defaultShowOption, ...option };
            setVisible(true);
            if (config?.ledPattern) {
              setLedPattern(icons[config.ledPattern]);
            }
            if (config?.move) {
              setMove(config.move);
            }
            if (config?.backgroundMode) {
              setMode(config.backgroundMode);
            }
            await delayInSec(config.duration);
          },
          setMove,
          reset() {
            setVisible(false);
            setLedPattern(Off);
          },
        };
      },
      [delayInSec]
    );

    return (
      <Stack
        position="relative"
        width={{ base: "100%", sm: "60%", md: "50%" }}
        height="auto"
        opacity={visible ? 1 : 0}
        {...props}
      >
        {/* Sparkly heart background */}
        {backgroundMode === "sparkly-heart" &&
          [
            { delay: 0 },
            { delay: 1, top: "50%", left: "-25%" },
            { delay: 2, top: "25%", left: "-50%" },
            { delay: 3, top: "80%", left: "-30%" },
          ].map(({ delay, ...props }, i) => (
            <HeartLedIcon
              key={i}
              size="2em"
              position="absolute"
              animation={withPlayState(
                `${sparkle} 2s ease-in-out ${delay * 0.5}s`
              )}
              opacity={0}
              color={litLedColor}
              {...props}
            />
          ))}
        {/* Sparkly cross background */}
        {backgroundMode === "sparkly-cross" &&
          [
            { delay: 0, left: "10%" },
            { delay: 1, top: "80%", left: "-20%" },
            { delay: 2, top: "80%", right: "20%" },
            { delay: 3, top: "50%", right: "-10%" },
          ].map(({ delay, top, left, right }, i) => (
            <CrossLedIcon
              key={i}
              size="2em"
              position="absolute"
              animation={withPlayState(
                `${sparkle} 2s ease-in-out ${delay * 0.5}s`
              )}
              opacity={0}
              color={litLedColor}
              top={top}
              left={left}
              right={right}
              width="15%"
              height="15%"
            />
          ))}
        <Icon
          viewBox="0 0 250.61 236.16"
          fill="red"
          width="100%"
          height="auto"
          transform="rotate(15deg)"
          {...(move === "bob"
            ? {
                animation: withPlayState(
                  `${animationKeyframes["bob"]} 1.1s ease-in-out infinite`
                ),
              }
            : move === "wave"
            ? {
                transformOrigin: "bottom center",
                animation: withPlayState(
                  `${animationKeyframes.wave} 1.1s ease-in-out infinite`
                ),
              }
            : {})}
        >
          {/* Hand outline */}
          <path
            fill="#1e1e1c"
            d="M53.95,235.31c-1.41-1.25-1.54-3.33-.29-4.74l66.79-74.7c.71-.81,1.74-1.15,2.79-1.12,16.85,1.45,33.48-5.18,44.72-17.68l46.45-51.68c1.43-1.61,2.25-3.76,2.02-5.93-.04-2.19-1.11-4.22-2.72-5.64l-.1-.09c-3.32-2.94-8.55-2.72-11.48.6l-21.13,23.47c-1.25,1.41-3.33,1.54-4.74.29-1.41-1.25-1.54-3.34-.29-4.74l37.71-42c1.43-1.61,2.25-3.76,2.12-5.84-.04-2.19-1.12-4.22-2.73-5.64-3.22-2.85-8.16-2.74-11.22.3l-38.08,42.22c-1.25,1.41-3.34,1.54-4.74.29s-1.54-3.34-.29-4.74l37.71-42,.36-.4,7.23-7.96c1.43-1.61,2.25-3.75,2.02-5.93-.04-2.19-1.11-4.22-2.72-5.64l-.1-.09c-3.32-2.94-8.54-2.72-11.57.71l-6.87,7.56-.71.81-37.81,41.91c-1.25,1.41-3.43,1.45-4.74.29-1.41-1.25-1.54-3.34-.29-4.74l38.25-42.61c2.46-3.39,2.08-8.03-1.05-10.98l-.1-.09c-3.42-3.03-8.54-2.72-11.57.71l-43.16,47.95-16.59,18.34c-1.25,1.41-3.34,1.54-4.74.29-1.41-1.25-1.54-3.33-.29-4.74l20.86-23.17c5.79-6.54,5.28-16.51-1.28-22.49-.1-.09-.29-.08-.39-.17,0,0-.19,0-.37.21l-34.51,38.38c-11.41,12.69-16.24,30.31-12.74,47.05.16,1.04-.06,2.1-.78,2.9L5.89,188.83c-1.25,1.41-3.33,1.54-4.74.29s-1.54-3.33-.29-4.74l65.81-73.6c-3.31-18.36,2.2-37.36,14.68-51.26l34.51-38.38c1.25-1.41,3.1-2.28,4.99-2.4,1.9-.11,3.84.53,5.16,1.88,4.63,4.1,7.16,9.75,7.42,15.54l28.18-31.24c5.53-6.05,14.83-6.62,20.97-1.18l.1.09c2.32,2.05,3.71,4.54,4.45,7.35,2.52-2.44,5.95-3.89,9.47-4,3.98-.24,7.78,1.14,10.8,3.81,3.02,2.67,4.67,6.29,4.91,10.27.22,3.6-.9,7.1-3.01,9.9,2.69.41,5.43,1.57,7.74,3.62l.1.09c3.02,2.67,4.67,6.29,4.91,10.27.24,3.99-1.14,7.78-3.82,10.8l-8.29,9.17c2.79.5,5.53,1.66,7.74,3.62,3.02,2.67,4.67,6.29,4.91,10.27.24,3.99-1.14,7.78-3.82,10.8l-46.45,51.68c-12.3,13.7-30.32,21.08-48.68,19.92l-65.72,73.5c-.48,1.55-2.56,1.68-3.97.43"
          />

          {/* Glove white fill */}
          <path
            fill="#fff"
            d="M123.46,167.85l-59.33-52.82c-2.56-2.28-6.48-2.05-8.75.51l-40.6,45.61c-2.28,2.56-2.05,6.48.51,8.75,0,0,0,0,0,0l2.02,1.8c1.95-.54,3.97.6,4.52,2.55.14.51.17,1.04.09,1.56l8.06,7.18c1.95-.54,3.97.6,4.52,2.55.14.51.17,1.04.09,1.56l8.06,7.18c1.95-.54,3.97.6,4.52,2.55.14.51.17,1.04.09,1.56l8.06,7.18c1.95-.54,3.97.6,4.52,2.55.14.51.17,1.04.09,1.56l8.06,7.18c1.95-.54,3.97.6,4.52,2.55.14.51.17,1.04.09,1.56l2.02,1.8c2.56,2.28,6.48,2.05,8.75-.51,0,0,0,0,0,0l40.61-45.61c2.28-2.56,2.05-6.48-.51-8.75"
          />

          {/* Glove outline */}
          <path
            fill="none"
            stroke="#010101"
            strokeWidth="5"
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M123.46,167.85l-59.33-52.82c-2.56-2.28-6.48-2.05-8.75.51l-40.6,45.61c-2.28,2.56-2.05,6.48.51,8.75,0,0,0,0,0,0l2.02,1.8c1.95-.54,3.97.6,4.52,2.55.14.51.17,1.04.09,1.56l8.06,7.18c1.95-.54,3.97.6,4.52,2.55.14.51.17,1.04.09,1.56l8.06,7.18c1.95-.54,3.97.6,4.52,2.55.14.51.17,1.04.09,1.56l8.06,7.18c1.95-.54,3.97.6,4.52,2.55.14.51.17,1.04.09,1.56l8.06,7.18c1.95-.54,3.97.6,4.52,2.55.14.51.17,1.04.09,1.56l2.02,1.8c2.56,2.28,6.48,2.05,8.75-.51,0,0,0,0,0,0l40.61-45.61c2.28-2.56,2.05-6.48-.51-8.75Z"
          />

          {/* Knuckle circles */}
          {[
            "M80.75,212.64c-1.35,1.52-3.67,1.65-5.19.3-1.52-1.35-1.65-3.67-.3-5.19,1.35-1.52,3.67-1.65,5.19-.3,1.52,1.35,1.65,3.67.3,5.19,0,0,0,0,0,0Z",
            "M68.08,201.36c-1.35,1.52-3.67,1.65-5.19.3-1.52-1.35-1.65-3.67-.3-5.19,1.35-1.52,3.67-1.65,5.19-.3,1.52,1.35,1.65,3.67.3,5.19,0,0,0,0,0,0Z",
            "M55.41,190.09c-1.35,1.52-3.67,1.65-5.19.3-1.52-1.35-1.65-3.67-.3-5.19s3.67-1.65,5.19-.3c0,0,0,0,0,0,1.51,1.35,1.65,3.67.3,5.19Z",
            "M42.74,178.81c-1.35,1.52-3.67,1.65-5.19.3-1.52-1.35-1.65-3.67-.3-5.19,1.35-1.52,3.67-1.65,5.19-.3,0,0,0,0,0,0,1.52,1.35,1.65,3.67.3,5.19Z",
            "M30.07,167.53c-1.35,1.52-3.67,1.65-5.19.3-1.52-1.35-1.65-3.67-.3-5.19,1.35-1.52,3.67-1.65,5.19-.3h0c1.52,1.35,1.65,3.67.3,5.19Z",
          ].map((d, i) => (
            <path
              key={i}
              fill="none"
              stroke="#010101"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              d={d}
            />
          ))}

          {/* Black diamonds */}
          <path
            fill="#010101"
            d="M94.34,198.49l-6.59-5.86c-.45-.41-.49-1.1-.09-1.56l5.86-6.59c.41-.45,1.1-.49,1.56-.09l6.59,5.86c.45.41.49,1.1.09,1.56l-5.86,6.59c-.41.45-1.1.49-1.56.09"
          />
          <path
            fill="none"
            stroke="#010101"
            strokeWidth=".66"
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M94.34,198.49l-6.59-5.86c-.45-.41-.49-1.1-.09-1.56l5.86-6.59c.41-.45,1.1-.49,1.56-.09l6.59,5.86c.45.41.49,1.1.09,1.56l-5.86,6.59c-.41.45-1.1.49-1.56.09Z"
          />
          <path
            fill="#010101"
            d="M43.65,153.37l-6.59-5.86c-.45-.41-.49-1.1-.09-1.56l5.86-6.59c.41-.45,1.1-.49,1.56-.09l6.59,5.86c.45.41.49,1.1.09,1.56l-5.86,6.58c-.41.45-1.1.49-1.56.09"
          />

          {/* White circles on diamonds */}
          <path
            fill="#fff"
            d="M96.49,193.03c-.88.98-2.39,1.07-3.37.2-.98-.88-1.07-2.39-.2-3.37.88-.98,2.39-1.07,3.37-.2.98.88,1.07,2.39.2,3.37,0,0,0,0,0,0"
          />
          <path
            fill="none"
            stroke="#fff"
            strokeMiterlimit="10"
            strokeWidth="1.1"
            d="M96.49,193.03c-.88.98-2.39,1.07-3.37.2-.98-.88-1.07-2.39-.2-3.37.88-.98,2.39-1.07,3.37-.2.98.88,1.07,2.39.2,3.37,0,0,0,0,0,0Z"
          />
          <path
            fill="#fff"
            d="M45.81,147.91c-.88.98-2.39,1.07-3.37.2-.98-.88-1.07-2.39-.2-3.37.88-.98,2.39-1.07,3.37-.2.98.88,1.07,2.39.2,3.37h0"
          />
          <path
            fill="none"
            stroke="#fff"
            strokeMiterlimit="10"
            strokeWidth="1.1"
            d="M45.81,147.91c-.88.98-2.39,1.07-3.37.2-.98-.88-1.07-2.39-.2-3.37.88-.98,2.39-1.07,3.37-.2.98.88,1.07,2.39.2,3.37h0Z"
          />

          {/* Triangle folds */}
          <path
            fill="#010101"
            d="M78.04,127.99l-34.79,1.91,13.15-14.78c1.75-1.97,4.77-2.15,6.74-.39l14.9,13.26Z"
          />
          <path
            fill="#010101"
            d="M86.78,135.84l-17.53.91,8.27-9.22,9.27,8.31Z"
          />
          <path fill="#010101" d="M90.86,139.44l-8.75.51,4.16-4.64,4.6,4.12Z" />

          {/* Small detail dots */}
          <path
            fill="#010101"
            d="M87.93,152.99c.37.32.93.27,1.25-.1.32-.37.27-.93-.1-1.25-.37-.31-.92-.28-1.24.08-.33.37-.29.94.08,1.27"
          />
          <path
            fill="#010101"
            d="M84.14,147.21c-.37-.32-.93-.27-1.25.1-.32.37-.27.93.1,1.25.37.31.92.28,1.24-.08.33-.37.29-.94-.08-1.27"
          />
          <path
            fill="#010101"
            d="M85.31,145.91c-1.06-1-2.73-.95-3.73.12-1,1.06-.95,2.73.12,3.73.03.03.06.05.09.08l5.03,4.51c1.06,1,2.73.96,3.73-.1,1-1.06.96-2.73-.1-3.73-.03-.03-.07-.06-.1-.09l-5.03-4.51ZM85.65,155.65l-5.03-4.51c-1.84-1.58-2.06-4.36-.47-6.2,1.58-1.84,4.36-2.06,6.2-.47.05.04.1.09.14.13l5.03,4.51c1.85,1.58,2.07,4.35.49,6.2-1.58,1.85-4.35,2.07-6.2.49-.05-.05-.11-.09-.16-.14"
          />

          {/* Led grid pattern */}
          {[
            [68.99, 151.2],
            [73.83, 155.51],
            [78.67, 159.82],
            [83.51, 164.12],
            [88.35, 168.43],
            [64.68, 156.04],
            [69.52, 160.35],
            [74.36, 164.65],
            [79.2, 168.96],
            [84.04, 173.27],
            [60.37, 160.88],
            [65.21, 165.19],
            [70.05, 169.49],
            [74.89, 173.8],
            [79.73, 178.11],
            [56.06, 165.72],
            [60.9, 170.03],
            [65.74, 174.33],
            [70.58, 178.64],
            [75.42, 182.95],
            [51.76, 170.56],
            [56.6, 174.87],
            [61.44, 179.17],
            [66.28, 183.48],
            [71.12, 187.79],
          ].map(([x, y], i) => (
            <circle
              key={i}
              cx={x}
              cy={y}
              r={parseInt(ledPattern[i]) ? 2 : 1.5}
              fill={parseInt(ledPattern[i]) ? litLedColor : unlitLedColor}
            />
          ))}
        </Icon>
      </Stack>
    );
  }
);

export default MicrobitOnWrist;
