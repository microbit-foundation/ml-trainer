/**
 * (c) 2023, Center for Computational Thinking and Design at Aarhus University and contributors
 * Modifications (c) 2024, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { Box, BoxProps } from "@chakra-ui/react";
import {
  Chart,
  LineController,
  LineElement,
  LinearScale,
  PointElement,
  registerables,
} from "chart.js";
import { useEffect, useRef } from "react";
import { useGraphColors } from "../hooks/use-graph-colors";
import { useGraphLineStyles } from "../hooks/use-graph-line-styles";
import { XYZData } from "../model";
import { getConfig as getRecordingChartConfig } from "../recording-graph";
import { useSettings } from "../store";

interface RecordingGraphProps extends BoxProps {
  data: XYZData;
  responsive?: boolean;
}

const RecordingGraph = ({
  data,
  responsive = false,
  children,
  ...rest
}: RecordingGraphProps) => {
  const [{ graphColorScheme, graphLineScheme, graphLineWeight }] =
    useSettings();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const colors = useGraphColors(graphColorScheme);
  const lineStyles = useGraphLineStyles(graphLineScheme);
  useEffect(() => {
    Chart.unregister(...registerables);
    Chart.register([LinearScale, LineController, PointElement, LineElement]);
    const chart = new Chart(
      canvasRef.current?.getContext("2d") ?? new HTMLCanvasElement(),
      getRecordingChartConfig(
        data,
        responsive,
        colors,
        lineStyles,
        graphLineWeight
      )
    );
    return () => {
      chart.destroy();
    };
  }, [colors, data, graphLineWeight, lineStyles, responsive]);

  return (
    <Box
      borderRadius="md"
      borderWidth={1}
      borderColor="gray.200"
      w="158px"
      height="100%"
      position="relative"
      {...rest}
    >
      {/* canvas dimensions must account for parent border width */}
      <canvas width="156px" height="92px" ref={canvasRef} />
      {children}
    </Box>
  );
};

export default RecordingGraph;
