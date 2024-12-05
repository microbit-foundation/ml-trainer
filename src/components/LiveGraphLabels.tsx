/**
 * (c) 2023, Center for Computational Thinking and Design at Aarhus University and contributors
 * Modifications (c) 2024, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { Box, Icon, Text } from "@chakra-ui/react";
import { AccelerometerDataEvent } from "@microbit/microbit-connection";
import React, { useEffect, useMemo, useRef } from "react";
import { RiArrowDropLeftFill } from "react-icons/ri";
import { useConnectActions } from "../connect-actions-hooks";
import { useGraphColors } from "../hooks/use-graph-colors";
import { getLabelHeights } from "../live-graph-label-config";
import { smoothenDataPoint } from "./LiveGraph";
import { useSettings } from "../store";

const LiveGraphLabels = () => {
  const [{ graphColorScheme }] = useSettings();
  const colors = useGraphColors(graphColorScheme);
  const connectActions = useConnectActions();

  const xArrowHeightRef = useRef<HTMLDivElement>(null);
  const xLabelHeightRef = useRef<HTMLParagraphElement>(null);
  const yArrowHeightRef = useRef<HTMLDivElement>(null);
  const yLabelHeightRef = useRef<HTMLParagraphElement>(null);
  const zArrowHeightRef = useRef<HTMLDivElement>(null);
  const zLabelHeightRef = useRef<HTMLParagraphElement>(null);

  const labelConfig = useMemo(
    () => [
      {
        label: "x",
        color: colors.x,
        arrowHeightRef: xArrowHeightRef,
        labelHeightRef: xLabelHeightRef,
      },
      {
        label: "y",
        color: colors.y,
        arrowHeightRef: yArrowHeightRef,
        labelHeightRef: yLabelHeightRef,
      },
      {
        label: "z",
        color: colors.z,
        arrowHeightRef: zArrowHeightRef,
        labelHeightRef: zLabelHeightRef,
      },
    ],
    [colors.x, colors.y, colors.z]
  );

  const dataRef = useRef<{ x: number; y: number; z: number }>({
    x: 0,
    y: 0,
    z: 0,
  });

  useEffect(() => {
    const listener = ({ data }: AccelerometerDataEvent) => {
      dataRef.current = {
        x: smoothenDataPoint(dataRef.current.x, data.x),
        y: smoothenDataPoint(dataRef.current.y, data.y),
        z: smoothenDataPoint(dataRef.current.z, data.z),
      };
      const labelHeights = getLabelHeights(dataRef.current);
      labelConfig.forEach((config) => {
        const heights = labelHeights.find((v) => v.label === config.label);
        if (
          heights &&
          config.arrowHeightRef.current &&
          config.labelHeightRef.current
        ) {
          config.arrowHeightRef.current.style.transform = `translateY(${heights.arrowHeight}rem)`;
          config.labelHeightRef.current.style.transform = `translateY(${heights.labelHeight}rem)`;
        }
      });
    };
    connectActions.addAccelerometerListener(listener);
    return () => {
      connectActions.removeAccelerometerListener(listener);
    };
  }, [connectActions, labelConfig]);

  return (
    <Box w={10} h={40} position="relative">
      {labelConfig.map((config, idx) => (
        <React.Fragment key={idx}>
          <Box
            ref={config.arrowHeightRef}
            ml={-7}
            color={config.color}
            position="absolute"
            w="fit-content"
          >
            <Icon as={RiArrowDropLeftFill} boxSize={12} />
          </Box>
          <Text
            ref={config.labelHeightRef}
            ml={1}
            fontSize="xl"
            position="absolute"
            color={config.color}
            w="fit-content"
          >
            {config.label}
          </Text>
        </React.Fragment>
      ))}
    </Box>
  );
};

export default LiveGraphLabels;
