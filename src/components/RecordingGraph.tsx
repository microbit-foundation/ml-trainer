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
import { XYZData } from "../model";
import { getConfig as getRecordingChartConfig } from "../recording-graph";
import { useGraphColors } from "../hooks/use-graph-colors";
import { useSettings } from "../store";
import { useGraphLineStyles } from "../hooks/use-graph-line-styles";

interface RecordingGraphProps extends BoxProps {
  data: XYZData;
}

const RecordingGraph = ({ data, children, ...rest }: RecordingGraphProps) => {
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
      getRecordingChartConfig(data, colors, lineStyles, graphLineWeight)
    );
    return () => {
      chart.destroy();
    };
  }, [colors, data, graphLineWeight, lineStyles]);

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
      <canvas width="158px" height="95px" ref={canvasRef} />
      {children}
    </Box>
  );
};

export default RecordingGraph;
