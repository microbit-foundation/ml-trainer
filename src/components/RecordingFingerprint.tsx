import { Box, BoxProps } from "@chakra-ui/react";
import * as tfvis from "@tensorflow/tfjs-vis";
import { useEffect, useMemo, useRef } from "react";
import { applyFilters, getFilterLabels } from "../ml";
import { XYZData } from "../model";

interface RecordingFingerprintProps extends BoxProps {
  data: XYZData;
  gestureName: string;
}

const RecordingFingerprint = ({
  data,
  gestureName,
  ...rest
}: RecordingFingerprintProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartData = useMemo(
    () => ({
      values: [applyFilters(data, { normalize: true })],
      xTickLabels: [gestureName],
      yTickLabels: getFilterLabels(),
    }),
    [data, gestureName]
  );
  useEffect(() => {
    if (containerRef.current) {
      void tfvis.render.heatmap(containerRef.current, chartData, {
        colorMap: "viridis",
        height: 99,
        width: 200,
        domain: [0, 1],
        fontSize: 0,
      });
    }
  }, [chartData]);

  return (
    <Box
      w="80px"
      h="100%"
      // Used to hide the unwanted parts of the heatmap chart.
      overflow="hidden"
      position="relative"
      borderRadius="md"
      borderWidth={1}
      borderColor="gray.200"
      {...rest}
    >
      <Box ref={containerRef} left="-10px" position="absolute" />
    </Box>
  );
};

export default RecordingFingerprint;
