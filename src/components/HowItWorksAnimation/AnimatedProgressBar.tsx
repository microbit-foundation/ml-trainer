import { Box, keyframes } from "@chakra-ui/react";
import { forwardRef, useImperativeHandle, useState } from "react";
import { delayInSec } from "../../utils/delay";

const progressBar = keyframes({
  "0%": { width: 0 },
  "90%": { width: "100%" },
  "100%": { width: "100%" },
});

export interface AnimatedProgressBarRef {
  play(duration?: number): Promise<void>;
  reset(): void;
}

const AnimatedProgressBar = forwardRef<AnimatedProgressBarRef>(
  function AnimatedProgressBar(_, ref) {
    const [durationInSecs, setDuration] = useState<null | number>(null);
    useImperativeHandle(
      ref,
      () => ({
        async play(secs = 1.5) {
          setDuration(secs);
          await delayInSec(secs);
        },
        reset() {
          setDuration(null);
        },
      }),
      []
    );
    if (durationInSecs === null) {
      return null;
    }
    return (
      <Box
        height="0.75em"
        width="5em"
        rounded="full"
        background="#DDDDDD"
        position="relative"
      >
        <Box
          position="absolute"
          height="100%"
          rounded="full"
          zIndex={2}
          background="brand2.500"
          animation={`${progressBar} ${durationInSecs}s ease-in-out forwards`}
          bottom={0}
          display="block"
          left={0}
        />
      </Box>
    );
  }
);

export default AnimatedProgressBar;
