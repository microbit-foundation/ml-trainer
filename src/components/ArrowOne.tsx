/**
 * (c) 2024, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { Box, Text, useToken } from "@chakra-ui/react";

const ArrowOne = () => {
  const [brand500] = useToken("colors", ["brand2.500"]);
  return (
    <svg
      width="250"
      height="40"
      viewBox="0 0 250 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect x="35" y="15" width="180" height="10" fill={brand500} />
      <circle cx="230" cy="20" r="20" fill={brand500} />
      <path d="M0 19.5L38.25 4.34455V34.6554L0 19.5Z" fill={brand500} />
      <foreignObject x="210" y="0" width="40" height="40">
        <Box
          aria-hidden
          height="40px"
          width="40px"
          display="flex"
          alignItems="center"
          justifyContent="center"
        >
          <Text fontSize="2xl" color="white">
            1
          </Text>
        </Box>
      </foreignObject>
    </svg>
  );
};

export default ArrowOne;
