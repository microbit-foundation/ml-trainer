/**
 * (c) 2026, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { CSSProperties } from "react";
import {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import {
  MicrobitBoardFront,
  MicrobitBoardFrontRef,
} from "./MicrobitBoardFront";
import {
  Box,
  HStack,
  SystemStyleObject,
  Text,
  token,
  VStack,
} from "../../shared-ui";
import { useAnimation } from "../AnimationProvider";

export interface ABLabelledMicrobitBoardRef {
  playHoldAB(): Promise<void>;
  playBluetoothPattern(): Promise<void>;
  reset(): void;
}

interface ABLabelledMicrobitBoardProps {
  /** A resolved CSS colour (not a token name). */
  activeColor: string;
  /** Sizing from the call site, merged as one literal. */
  css?: SystemStyleObject;
}

const inactiveColor = token("colors.gray.500");

const ABLabelledMicrobitBoard = forwardRef<
  ABLabelledMicrobitBoardRef,
  ABLabelledMicrobitBoardProps
>(function ABLabelledMicrobitBoard({ activeColor, css: cssProp }, ref) {
  const microbitBoardFrontRef = useRef<MicrobitBoardFrontRef>(null);
  const buttonLabelARef = useRef<ButtonLabelRef>(null);
  const buttonLabelBRef = useRef<ButtonLabelRef>(null);
  const [ABButtonOutlineColor, setABButtonOutlineColor] =
    useState<string>(inactiveColor);
  const [plusTextColor, setPlusTextColor] = useState<string>(inactiveColor);
  useImperativeHandle(
    ref,
    () => {
      return {
        async playHoldAB() {
          setABButtonOutlineColor(activeColor);
          await Promise.all([
            buttonLabelARef.current?.play(),
            buttonLabelBRef.current?.play(),
          ]);
          setPlusTextColor(activeColor);
        },

        async playBluetoothPattern() {
          await microbitBoardFrontRef.current?.playBluetoothPattern();
        },

        reset() {
          setABButtonOutlineColor(inactiveColor);
          setPlusTextColor(inactiveColor);
          buttonLabelARef.current?.reset();
          buttonLabelBRef.current?.reset();
          microbitBoardFrontRef.current?.reset();
        },
      };
    },
    [activeColor]
  );

  return (
    <VStack position="relative" css={cssProp}>
      <HStack justifyContent="space-between" w="100%">
        <ButtonLabel text="A" ref={buttonLabelARef} activeColor={activeColor} />
        <Text fontWeight="bold" fontSize="xl" style={{ color: plusTextColor }}>
          +
        </Text>
        <ButtonLabel text="B" ref={buttonLabelBRef} activeColor={activeColor} />
      </HStack>
      <MicrobitBoardFront
        ref={microbitBoardFrontRef}
        css={{ width: "100%", height: "100%" }}
        buttonStrokeColor={ABButtonOutlineColor}
      />
    </VStack>
  );
});

interface ButtonLabelProps {
  text: string;
  /** A resolved CSS colour (not a token name). */
  activeColor: string;
}

interface ButtonLabelRef {
  play(): Promise<void>;
  reset(): void;
}

const buttonLabelFillDuration = 0.75; // sec

const ButtonLabel = forwardRef<ButtonLabelRef, ButtonLabelProps>(
  function ButtonLabel({ activeColor, text }, ref) {
    const { delayInSec, withPlayState, prefersReducedMotion } = useAnimation();
    const [playing, setPlaying] = useState<boolean>(false);

    // Fill effect: a bottom-anchored gradient in the active colour grows via
    // the preset's textBoxFillUp/lineScaleUp keyframes. Colour and play state
    // are runtime values, so the whole lot is an inline style.
    const buttonLabelAnimationStyle = useCallback(
      (keyframeName: string): CSSProperties => {
        return {
          backgroundImage: `linear-gradient(to top, ${activeColor}, ${activeColor})`,
          backgroundRepeat: "no-repeat",
          backgroundPosition: "bottom",
          backgroundSize: "100% 0%",
          animation: withPlayState(
            `${keyframeName} ${buttonLabelFillDuration}s ease-in-out forwards`
          ),
        };
      },
      [activeColor, withPlayState]
    );
    useImperativeHandle(
      ref,
      () => {
        return {
          async play() {
            setPlaying(true);
            await delayInSec(buttonLabelFillDuration);
          },
          reset() {
            setPlaying(false);
          },
        };
      },
      [delayInSec]
    );
    return (
      <Box position="relative" w="27%">
        <Text
          px="3%"
          py="5%"
          textAlign="center"
          borderRadius="0.5rem"
          fontWeight="bold"
          fontSize="lg"
          color="white"
          style={{
            backgroundColor:
              prefersReducedMotion && playing ? activeColor : inactiveColor,
            ...(playing ? buttonLabelAnimationStyle("textBoxFillUp") : {}),
          }}
        >
          {text}
        </Text>
        <Box
          position="absolute"
          top="100%"
          w="15%"
          h="190%"
          left="42.5%"
          style={{ backgroundColor: inactiveColor }}
        />
        <Box
          position="absolute"
          top="100%"
          w="16%"
          h="191%"
          left="42.5%"
          transformOrigin="bottom"
          style={{
            transform:
              prefersReducedMotion && playing ? "scaleY(1)" : "scaleY(0)",
            backgroundColor: activeColor,
            ...(playing ? buttonLabelAnimationStyle("lineScaleUp") : {}),
          }}
        />
      </Box>
    );
  }
);

export default ABLabelledMicrobitBoard;
