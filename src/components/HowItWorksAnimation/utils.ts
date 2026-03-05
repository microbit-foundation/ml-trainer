import { keyframes } from "@emotion/react";

export const litLedColor = "#CD0365";
export const unlitLedColor = "#dbd9dc";

export const ledPatternOptions = {
  default: [
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  ],
  smile: [
    0, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 1, 1, 1, 0,
  ],
};

export const animation = {
  fadeIn: keyframes({
    "0%": { opacity: 0 },
    "100%": { opacity: 1 },
  }),
};
