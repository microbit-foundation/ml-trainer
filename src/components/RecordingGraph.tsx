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

interface RecordingGraphProps extends BoxProps {
  data: XYZData;
}

const RecordingGraph = ({ data, ...rest }: RecordingGraphProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    Chart.unregister(...registerables);
    Chart.register([LinearScale, LineController, PointElement, LineElement]);
    const chart = new Chart(
      canvasRef.current?.getContext("2d") ?? new HTMLCanvasElement(),
      getRecordingChartConfig(data)
    );
    return () => {
      chart.destroy();
    };
  }, [data]);

  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <Box
      ref={containerRef}
      borderRadius="md"
      borderWidth={1}
      borderColor="gray.200"
      w="158px"
      height="100%"
      {...rest}
    >
      <canvas width="158px" height="95px" ref={canvasRef} />
    </Box>
  );
};

export default RecordingGraph;
