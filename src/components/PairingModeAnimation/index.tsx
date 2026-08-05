/**
 * (c) 2026, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { Box, Stack, VisuallyHidden } from "@chakra-ui/react";
import { useEffect, useRef, useState } from "react";
import { useIntl } from "react-intl";
import { BluetoothPairingMethod } from "../../data-connection-flow/data-connection-types";
import { useAnimation } from "../AnimationProvider";
import ABLabelledMicrobitBoard, {
  ABLabelledMicrobitBoardRef,
} from "./ABLabelledMicrobitBoard";
import {
  MicrobitBoardFront,
  MicrobitBoardFrontRef,
} from "./MicrobitBoardFront";
import ResetPressedMicrobitBoard, {
  ResetPressedMicrobitBoardRef,
} from "./ResetPressedMicrobitBoard";

interface PairingModeAnimationProps {
  pairingMethod: BluetoothPairingMethod;
}

const durations = {
  startPause: 1,
  pause: 0.1,
  // Hold the finished state so the result can be read before the loop restarts.
  endPause: 1.5,
};

/**
 * For the triple reset method the two boards are the same micro:bit shown from
 * both sides, so we dim the one that isn't being acted on. This directs
 * attention from the reset presses to the resulting LED pattern.
 */
const inactiveBoardOpacity = 0.35;
const boardOpacityTransition = "opacity 0.3s";

type ActiveBoard = "back" | "front";

const PairingModeAnimation = ({ pairingMethod }: PairingModeAnimationProps) => {
  const intl = useIntl();
  const microbitABBoardFrontRef = useRef<ABLabelledMicrobitBoardRef>(null);
  const microbitBoardFrontRef = useRef<MicrobitBoardFrontRef>(null);
  const microbitBoardBackRef = useRef<ResetPressedMicrobitBoardRef>(null);

  const { restartAbortController, delayInSec, prefersReducedMotion } =
    useAnimation();
  const isTripleReset = pairingMethod === "triple-reset";
  const [activeBoard, setActiveBoard] = useState<ActiveBoard>("back");

  useEffect(() => {
    const run = async () => {
      await delayInSec(durations.startPause);
      // eslint-disable-next-line no-constant-condition
      while (true) {
        try {
          switch (pairingMethod) {
            case "a-b-reset": {
              await microbitABBoardFrontRef.current?.playHoldAB();
              await delayInSec(durations.pause);
              await microbitBoardBackRef.current?.playPressed();
              await microbitABBoardFrontRef.current?.playBluetoothPattern();
              break;
            }
            case "triple-reset": {
              setActiveBoard("back");
              await microbitBoardBackRef.current?.playPressed(1);
              await microbitBoardBackRef.current?.playPressed(2);
              await microbitBoardBackRef.current?.playPressed(3);
              setActiveBoard("front");
              await microbitBoardFrontRef.current?.playBluetoothPattern();
            }
          }

          await delayInSec(durations.endPause);

          // Reset all.
          microbitABBoardFrontRef.current?.reset();
          microbitBoardFrontRef.current?.reset();
          microbitBoardBackRef.current?.reset();
          setActiveBoard("back");
          await delayInSec(durations.pause);
        } catch (e) {
          if (e instanceof DOMException && e.name === "AbortError") {
            // Abort running animation.
            return;
          }
          throw e;
        }
      }
    };

    restartAbortController();
    void run();
  }, [delayInSec, pairingMethod, restartAbortController]);

  return (
    <>
      <VisuallyHidden>
        <Box
          as="img"
          alt={intl.formatMessage({ id: "animation-bluetooth-mode-label" })}
        />
      </VisuallyHidden>
      <Stack
        py={3.5}
        aria-hidden
        direction={{
          base: "column",
          md: "row",
        }}
        justifyContent="center"
        gap={{ base: 10, md: "1rem" }}
        alignItems={isTripleReset ? "center" : { base: "center", md: "end" }}
        minH={{ base: "auto", md: "200px" }}
        userSelect="none"
      >
        {isTripleReset ? (
          <>
            <ResetPressedMicrobitBoard
              activeColor="brand2.500"
              handSide="left"
              ref={microbitBoardBackRef}
              w={{ base: "50%", md: "25%" }}
              opacity={activeBoard === "back" ? 1 : inactiveBoardOpacity}
              transition={
                prefersReducedMotion ? undefined : boardOpacityTransition
              }
            />
            <MicrobitBoardFront
              boxSize={{ base: "50%", md: "25%" }}
              ref={microbitBoardFrontRef}
              opacity={activeBoard === "front" ? 1 : inactiveBoardOpacity}
              transition={
                prefersReducedMotion ? undefined : boardOpacityTransition
              }
            />
          </>
        ) : (
          <>
            <ABLabelledMicrobitBoard
              activeColor="brand2.500"
              ref={microbitABBoardFrontRef}
              w={{ base: "50%", md: "25%" }}
            />
            <ResetPressedMicrobitBoard
              activeColor="brand2.500"
              ref={microbitBoardBackRef}
              w={{ base: "50%", md: "25%" }}
            />
          </>
        )}
      </Stack>
    </>
  );
};

export default PairingModeAnimation;
