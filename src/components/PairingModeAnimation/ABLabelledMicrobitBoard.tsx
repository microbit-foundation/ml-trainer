/**
 * (c) 2026, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
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
  StackProps,
  Text,
  TextProps,
  VStack,
  keyframes,
} from "@chakra-ui/react";
import { useAnimation } from "../AnimationProvider";

export interface ABLabelledMicrobitBoardRef {
  playHoldAB(): Promise<void>;
  playBluetoothPattern(): Promise<void>;
  reset(): void;
}

interface ABLabelledMicrobitBoardProps extends StackProps {
  activeColor: string;
}

const inactiveColor = "gray.500";

const ABLabelledMicrobitBoard = forwardRef<
  ABLabelledMicrobitBoardRef,
  ABLabelledMicrobitBoardProps
>(function ABLabelledMicrobitBoard({ activeColor, ...props }, ref) {
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
    <VStack position="relative" {...props}>
      <HStack justifyContent="space-between" w="100%">
        <ButtonLabel text="A" ref={buttonLabelARef} activeColor={activeColor} />
        <Text fontWeight="bold" fontSize="xl" color={plusTextColor}>
          +
        </Text>
        <ButtonLabel text="B" ref={buttonLabelBRef} activeColor={activeColor} />
      </HStack>
      <MicrobitBoardFront
        ref={microbitBoardFrontRef}
        boxSize="100%"
        buttonStrokeColor={ABButtonOutlineColor}
      />
    </VStack>
  );
});

interface ButtonLabelProps {
  text: string;
  activeColor: string;
}

interface ButtonLabelRef {
  play(): Promise<void>;
  reset(): void;
}

const textBoxFillUp = keyframes`
  75% { background-size: 100% 0%; }
  100%   { background-size: 100% 100%; }
`;

const lineScaleUp = keyframes`
  0%   { transform: scaleY(0); }
  75%  { transform: scaleY(1); }
  100% { transform: scaleY(1); }
`;

const buttonLabelFillDuration = 0.75; // sec

const ButtonLabel = forwardRef<ButtonLabelRef, ButtonLabelProps>(
  function ButtonLabel({ activeColor, text }, ref) {
    const { delayInSec, withPlayState } = useAnimation();
    const [playing, setPlaying] = useState<boolean>(false);

    const buttonLabelAnimationProps = useCallback(
      (keyframes: string): TextProps => {
        return {
          backgroundImage: `linear-gradient(to top, ${activeColor}, ${activeColor})`,
          backgroundRepeat: "no-repeat",
          backgroundPosition: "bottom",
          backgroundSize: "100% 0%",
          animation: withPlayState(
            `${keyframes} ${buttonLabelFillDuration}s ease-in-out forwards`
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
          backgroundColor={inactiveColor}
          borderRadius="0.5rem"
          fontWeight="bold"
          fontSize="lg"
          textColor="white"
          {...(playing ? buttonLabelAnimationProps(textBoxFillUp) : {})}
        >
          {text}
        </Text>
        <Box
          position="absolute"
          top="100%"
          w="15%"
          h="190%"
          left="42.5%"
          backgroundColor={inactiveColor}
        />
        <Box
          position="absolute"
          top="100%"
          w="16%"
          h="191%"
          left="42.5%"
          transformOrigin="bottom"
          transform="scaleY(0)"
          backgroundColor={activeColor}
          {...(playing ? buttonLabelAnimationProps(lineScaleUp) : {})}
        />
      </Box>
    );
  }
);

export default ABLabelledMicrobitBoard;
