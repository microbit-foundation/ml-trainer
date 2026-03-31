import { useEffect, useRef } from "react";
import { useAnimation } from "../AnimationProvider";
import ABLabelledMicrobitBoard, {
  ABLabelledMicrobitBoardRef,
} from "./ABLabelledMicrobitBoard";
import ResetPressedMicrobitBoard, {
  ResetPressedMicrobitBoardRef,
} from "./ResetPressedMicrobitBoard";
import { Box, Stack, VisuallyHidden } from "@chakra-ui/react";
import { useIntl } from "react-intl";

const ABResetAnimation = () => {
  const intl = useIntl();
  const microbitBoardFrontRef = useRef<ABLabelledMicrobitBoardRef>(null);
  const microbitBoardBackRef = useRef<ResetPressedMicrobitBoardRef>(null);

  const { restartAbortController, delayInSec } = useAnimation();

  useEffect(() => {
    const run = async () => {
      // eslint-disable-next-line no-constant-condition
      while (true) {
        try {
          await microbitBoardFrontRef.current?.playHoldAB();
          await delayInSec(0.2);
          await microbitBoardBackRef.current?.playPressed();
          await microbitBoardFrontRef.current?.playBluetoothPattern();

          microbitBoardFrontRef.current?.reset();
          microbitBoardBackRef.current?.reset();
          await delayInSec(0.1);
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
  }, [delayInSec, restartAbortController]);
  return (
    <>
      <VisuallyHidden>
        <Box
          as="img"
          aria-label={intl.formatMessage({ id: "animation-bluetooth-mode-label" })}
        />
      </VisuallyHidden>
      <Stack
        aria-hidden
        direction={{ base: "column", md: "row" }}
        justifyContent="center"
        gap="1rem"
        alignItems={{ base: "center", md: "end" }}
      >
        <ABLabelledMicrobitBoard
          ref={microbitBoardFrontRef}
          w={{ base: "50%", md: "25%" }}
        />
        <ResetPressedMicrobitBoard
          ref={microbitBoardBackRef}
          w={{ base: "50%", md: "25%" }}
        />
      </Stack>
    </>
  );
};

export default ABResetAnimation;
