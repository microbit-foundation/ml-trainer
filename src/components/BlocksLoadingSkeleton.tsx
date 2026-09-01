/**
 * (c) 2026, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { Box, css, VStack } from "@microbit/ui";

/** Pulsing skeleton lines shown while the blocks preview loads. */
const BlocksLoadingSkeleton = () => (
  <VStack w="xs" gap={5} alignItems="stretch" aria-hidden>
    {Array.from(Array(5)).map((_, idx) => (
      <Box
        // eslint-disable-next-line @eslint-react/no-array-index-key -- fixed list, position is identity
        key={idx}
        h={2}
        borderRadius="sm"
        className={css({
          bg: "gray.200",
          animation: "skeletonPulse 0.8s linear infinite alternate",
          _motionReduce: { animation: "none" },
        })}
      />
    ))}
  </VStack>
);

export default BlocksLoadingSkeleton;
