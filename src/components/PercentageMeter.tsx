/**
 * (c) 2024, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { HStack, StackProps } from "@chakra-ui/react";

interface PercentageMeterProps extends StackProps {
  value: number;
  colorScheme?: string;
  meterBarWidthPx?: number;
}

const PercentageMeter = ({
  value,
  colorScheme = "gray.600",
  meterBarWidthPx,
}: PercentageMeterProps) => {
  const height = 3;
  const numTicks = 9;
  return (
    <HStack
      w={`${meterBarWidthPx}px`}
      h={height}
      rounded="full"
      bgColor="gray.200"
      overflow="hidden"
      position="relative"
    >
      <HStack
        // Use inline style attribute to avoid style tags being
        // constantly appended to the <head/> element.
        style={{
          width: `${value}%`,
        }}
        h={height}
        rounded="full"
        bgColor={colorScheme}
      />
      <HStack
        display="inline-flex"
        w="full"
        h={height}
        position="absolute"
        justifyContent="space-between"
      >
        {
          // Adding 2 ticks with no background color for each end of the meter
          // so that the ticks can be justified using space-between
          Array(numTicks + 2)
            .fill(0)
            .map((_, i) => (
              <HStack
                key={i}
                bgColor={i === 0 || i === numTicks + 1 ? undefined : "white"}
                w={0.5}
                h={height}
              />
            ))
        }
      </HStack>
    </HStack>
  );
};

export default PercentageMeter;
