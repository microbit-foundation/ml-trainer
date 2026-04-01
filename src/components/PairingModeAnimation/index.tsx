/**
 * (c) 2026, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { Box, Stack, VisuallyHidden } from "@chakra-ui/react";
import { useEffect, useRef } from "react";
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
};

const PairingModeAnimation = ({ pairingMethod }: PairingModeAnimationProps) => {
  const intl = useIntl();
  const microbitABBoardFrontRef = useRef<ABLabelledMicrobitBoardRef>(null);
  const microbitBoardFrontRef = useRef<MicrobitBoardFrontRef>(null);
  const microbitBoardBackRef = useRef<ResetPressedMicrobitBoardRef>(null);

  const { restartAbortController, delayInSec } = useAnimation();
  const isTripleReset = pairingMethod === "triple-reset";

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
              await microbitBoardBackRef.current?.playPressed(1);
              await microbitBoardBackRef.current?.playPressed(2);
              await microbitBoardBackRef.current?.playPressed(3);
              await microbitBoardFrontRef.current?.playBluetoothPattern();
            }
          }

          // Reset all.
          microbitABBoardFrontRef.current?.reset();
          microbitBoardFrontRef.current?.reset();
          microbitBoardBackRef.current?.reset();
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
          aria-label={intl.formatMessage({
            id: "animation-bluetooth-mode-label",
          })}
        />
      </VisuallyHidden>
      <Stack
        aria-hidden
        direction={{ base: "column", md: "row" }}
        justifyContent="center"
        gap="1rem"
        alignItems={isTripleReset ? "center" : { base: "center", md: "end" }}
        minH={{ base: "auto", md: "180px" }}
      >
        {isTripleReset ? (
          <MicrobitBoardFront
            boxSize={{ base: "50%", md: "25%" }}
            ref={microbitBoardFrontRef}
          />
        ) : (
          <ABLabelledMicrobitBoard
            activeColor="brand2.500"
            ref={microbitABBoardFrontRef}
            w={{ base: "50%", md: "25%" }}
          />
        )}
        <ResetPressedMicrobitBoard
          activeColor="brand2.500"
          ref={microbitBoardBackRef}
          w={{ base: "50%", md: "25%" }}
        />
      </Stack>
    </>
  );
};

export default PairingModeAnimation;
