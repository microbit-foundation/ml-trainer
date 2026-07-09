/**
 * (c) 2024, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { useEffect, useRef } from "react";
import { HStack, token } from "../shared-ui";
import { useStore } from "../store";

interface PercentageMeterProps {
  actionId: string;
  meterBarWidthPx: number;
}

const PercentageMeter = ({
  actionId,
  meterBarWidthPx,
}: PercentageMeterProps) => {
  const numTicks = 9;

  const meterRef = useRef<HTMLDivElement>(null);
  const triggeredColor = token("colors.brand2.500");
  const defaultColor = token("colors.gray.600");

  useEffect(
    () =>
      useStore.subscribe(
        (s) => s.predictionResult,
        (predictionResult) => {
          if (!meterRef.current) return;
          meterRef.current.style.backgroundColor =
            predictionResult?.detected?.id === actionId
              ? triggeredColor
              : defaultColor;
          meterRef.current.style.width = `${
            (predictionResult?.confidences[actionId] ?? 0) * 100
          }%`;
        }
      ),
    [actionId, triggeredColor, defaultColor]
  );

  return (
    <HStack
      h={3}
      rounded="full"
      bg="gray.200"
      overflow="hidden"
      position="relative"
      // Prop-driven width; inline style (Panda can't extract computed values).
      style={{ width: `${meterBarWidthPx}px` }}
    >
      <HStack ref={meterRef} w={0} h={3} rounded="full" bg="gray.600" />
      <HStack
        display="inline-flex"
        w="full"
        h={3}
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
                bg={i === 0 || i === numTicks + 1 ? undefined : "white"}
                w={0.5}
                h={3}
              />
            ))
        }
      </HStack>
    </HStack>
  );
};

export default PercentageMeter;
