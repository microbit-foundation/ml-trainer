import { HStack } from "@chakra-ui/react";
import { useSize } from "@chakra-ui/react-use-size";
import { useEffect, useRef, useState } from "react";
import { SmoothieChart, TimeSeries } from "smoothie";

const LiveGraph = () => {
  // Updates width to ensure that the canvas fills the whole screen
  //   export let width: number;

  const connected = false;

  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [chart, setChart] = useState<SmoothieChart | undefined>(undefined);
  const lineWidth = 2;

  const liveGraphContainerRef = useRef(null);
  const { width, height } = useSize(liveGraphContainerRef) ?? {
    width: 100,
    height: 100,
  };

  // On mount draw smoothieChart
  useEffect(() => {
    if (!canvasRef.current) {
      return;
    }
    const smoothieChart = new SmoothieChart({
      maxValue: 2.3,
      minValue: -2,
      millisPerPixel: 7,
      grid: {
        fillStyle: "#ffffff00",
        strokeStyle: "rgba(48,48,48,0.20)",
        millisPerLine: 3000,
        borderVisible: false,
      },
      interpolation: "linear",
    });

    const lineX = new TimeSeries();
    const lineY = new TimeSeries();
    const lineZ = new TimeSeries();
    const recordLines = new TimeSeries();

    smoothieChart.addTimeSeries(lineX, { lineWidth, strokeStyle: "#f9808e" });
    smoothieChart.addTimeSeries(lineY, { lineWidth, strokeStyle: "#80f98e" });
    smoothieChart.addTimeSeries(lineZ, { lineWidth, strokeStyle: "#808ef9" });
    smoothieChart.addTimeSeries(recordLines, {
      lineWidth: 3,
      strokeStyle: "#4040ff44",
      fillStyle: "#0000ff07",
    });
    setChart(smoothieChart);
    smoothieChart.streamTo(canvasRef.current, 0);
    smoothieChart.render();
    return () => {
      smoothieChart.stop();
    };
  }, []);

  useEffect(() => {
    if (connected) {
      chart?.start();
    } else {
      chart?.stop();
    }
  }, [chart, connected]);

  // TODO Recording logic
  return (
    <HStack
      ref={liveGraphContainerRef}
      width="100%"
      height="100%"
      overflow="hidden"
    >
      <canvas
        ref={canvasRef}
        height={height}
        id="smoothie-chart"
        width={width - 30}
      />
    </HStack>
  );
};

export default LiveGraph;
