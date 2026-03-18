/**
 * (c) 2024, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { HStack, StackProps, useToken } from "@chakra-ui/react";
import { useEffect, useRef } from "react";
import { useStore } from "../store";

interface PercentageMeterProps extends StackProps {
  actionId: string;
  meterBarWidthPx: number;
}

const PercentageMeter = ({
  actionId,
  meterBarWidthPx,
}: PercentageMeterProps) => {
  const height = 3;
  const numTicks = 9;

  const meterRef = useRef<HTMLDivElement>(null);
  const [triggeredColor, defaultColor] = useToken("colors", [
    "brand2.500",
    "gray.600",
  ]);

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
      w={`${meterBarWidthPx}px`}
      h={height}
      rounded="full"
      bgColor="gray.200"
      overflow="hidden"
      position="relative"
    >
      <HStack
        ref={meterRef}
        w={0}
        h={height}
        rounded="full"
        bgColor={"gray.600"}
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
