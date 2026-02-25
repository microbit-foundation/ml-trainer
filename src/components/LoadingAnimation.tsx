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
import { Box, HStack } from "@chakra-ui/react";
import { keyframes } from "@emotion/react";

const load7 = keyframes`
  0%, 80%, 100% {
    box-shadow: 0 2.5em 0 -1.3em;
  }
  40% {
    box-shadow: 0 2.5em 0 0;
  }
`;

const dotStyles = {
  borderRadius: "50%",
  width: "25px",
  height: "25px",
  animationFillMode: "both",
  animation: `${load7} 1.8s infinite ease-in-out`,
};

const LoadingAnimation = () => {
  return (
    <HStack justifyContent="center" width="100%" h={25} position="relative">
      <Box
        color="brand2.500"
        fontSize="10px"
        position="absolute"
        top="-25px"
        textIndent="-9999em"
        transform="translateZ(0)"
        sx={{
          ...dotStyles,
          animationDelay: "-0.16s",
          "&::before, &::after": {
            content: '""',
            position: "absolute",
            top: 0,
            ...dotStyles,
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
