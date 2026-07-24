/**
 * (c) 2024, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
/**
 * Modified from css-loaders https://github.com/lukehaas/css-loaders
 * Copyright (c) 2014, Luke Haas
 * SPDX-License-Identifier: MIT
 */
import { Box, HStack } from "@microbit/ui";

const LoadingAnimation = () => {
  return (
    <HStack justifyContent="center" width="100%" h={25} position="relative">
      <Box
        css={{
          color: "brand2.500",
          fontSize: "10px",
          position: "absolute",
          top: "-25px",
          textIndent: "-9999em",
          transform: "translateZ(0)",
          borderRadius: "50%",
          width: "25px",
          height: "25px",
          animationFillMode: "both",
          animation: "load7 1.8s infinite ease-in-out",
          animationDelay: "-0.16s",
          "&::before, &::after": {
            content: '""',
            position: "absolute",
            top: 0,
            borderRadius: "50%",
            width: "25px",
            height: "25px",
            animationFillMode: "both",
            animation: "load7 1.8s infinite ease-in-out",
          },
          "&::before": {
            left: "-3.5em",
            animationDelay: "-0.32s",
          },
          "&::after": {
            left: "3.5em",
          },
        }}
      />
    </HStack>
  );
};

export default LoadingAnimation;
