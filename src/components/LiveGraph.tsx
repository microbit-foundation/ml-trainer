import { Box, HStack, Icon, Text } from "@chakra-ui/react";
import { useSize } from "@chakra-ui/react-use-size";
import { useEffect, useMemo, useRef, useState } from "react";
import { SmoothieChart, TimeSeries } from "smoothie";
import { useConnectActions } from "../connect-actions-hooks";
import { useConnectionStage } from "../connection-stage-hooks";
import { AccelerometerDataEvent } from "@microbit/microbit-connection";
import { MlStage, useMlStatus } from "../ml-status-hooks";
import { mlSettings } from "../ml";
import { ConnectionStatus } from "../connect-status-hooks";
import { RiArrowDropLeftFill } from "react-icons/ri";
import React from "react";
import { LabelConfig, getUpdatedLabelConfig } from "../live-graph-label-config";

const initialLabelConfigs: LabelConfig[] = [
  { label: "x", arrowHeight: 0, labelHeight: 0, color: "#f9808e", id: 0 },
  { label: "y", arrowHeight: 0, labelHeight: 0, color: "#80f98e", id: 1 },
  { label: "z", arrowHeight: 0, labelHeight: 0, color: "#808ef9", id: 2 },
];

const smoothenDataPoint = (curr: number, next: number) => {
  // TODO: Factor out so that recording graph can do the same
  // Remove dividing by 1000 operation once it gets moved to connection lib
  return (next / 1000) * 0.25 + curr * 0.75;
};

const LiveGraph = () => {
  const { isConnected, status } = useConnectionStage();
  const [{ stage }] = useMlStatus();
  const connectActions = useConnectActions();

  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [chart, setChart] = useState<SmoothieChart | undefined>(undefined);
  const lineWidth = 2;

  const liveGraphContainerRef = useRef(null);
  const { width, height } = useSize(liveGraphContainerRef) ?? {
    width: 100,
    height: 100,
  };

  const lineX = useMemo(() => new TimeSeries(), []);
  const lineY = useMemo(() => new TimeSeries(), []);
  const lineZ = useMemo(() => new TimeSeries(), []);
  const recordLines = useMemo(() => new TimeSeries(), []);

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
  }, [lineX, lineY, lineZ, recordLines]);

  useEffect(() => {
    if (isConnected || status === ConnectionStatus.ReconnectingAutomatically) {
      chart?.start();
    } else {
      chart?.stop();
    }
  }, [chart, isConnected, status]);

  // Draw on graph to display that users are recording
  const [isRecording, setIsRecording] = useState<boolean>(false);
  useEffect(() => {
    if (stage === MlStage.RecordingData && !isRecording) {
      {
        // Set the start recording line
        const now = new Date().getTime();
        recordLines.append(now - 1, -2, false);
        recordLines.append(now, 2.3, false);
        setIsRecording(true);
      }

      setTimeout(() => {
        // Set the end recording line
        const now = new Date().getTime();
        recordLines.append(now - 1, 2.3, false);
        recordLines.append(now, -2, false);
        setIsRecording(false);
      }, mlSettings.duration);
    }
  }, [isRecording, recordLines, stage]);

  const [labelConfigs, setLabelConfigs] =
    useState<LabelConfig[]>(initialLabelConfigs);

  const dataRef = useRef<{ x: number; y: number; z: number }>({
    x: 0,
    y: 0,
    z: 0,
  });

  useEffect(() => {
    const listener = ({ data }: AccelerometerDataEvent) => {
      const t = new Date().getTime();
      dataRef.current = {
        x: smoothenDataPoint(dataRef.current.x, data.x),
        y: smoothenDataPoint(dataRef.current.y, data.y),
        z: smoothenDataPoint(dataRef.current.z, data.z),
      };
      lineX.append(t, dataRef.current.x, false);
      lineY.append(t, dataRef.current.y, false);
      lineZ.append(t, dataRef.current.z, false);

      setLabelConfigs(getUpdatedLabelConfig(labelConfigs, dataRef.current));
    };
    if (isConnected) {
      connectActions.addAccelerometerListener(listener);
    }
    return () => {
      connectActions.removeAccelerometerListener(listener);
    };
  }, [connectActions, isConnected, labelConfigs, lineX, lineY, lineZ]);

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
      {isConnected && (
        <Box w={10} h={40} position="relative">
          {labelConfigs.map((config, idx) => (
            <React.Fragment key={idx}>
              <Box
                ml={-7}
                transform={`translateY(${config.arrowHeight - 0.55}rem)`}
                color={config.color}
                position="absolute"
                w="fit-content"
              >
                <Icon as={RiArrowDropLeftFill} boxSize={12} />
              </Box>
              <Text
                ml={1}
                fontSize="xl"
                position="absolute"
                color={config.color}
                transform={`translateY(${config.labelHeight - 0.1}rem)`}
                w="fit-content"
              >
                {config.label}
              </Text>
            </React.Fragment>
          ))}
        </Box>
      )}
    </HStack>
  );
};

export default LiveGraph;
