/**
 * (c) 2023, Center for Computational Thinking and Design at Aarhus University and contributors
 * Modifications (c) 2024, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { Box, useToken } from "@chakra-ui/react";
import { useSize } from "@chakra-ui/react-use-size";
import { AccelerometerData } from "@microbit/microbit-connection";
import { useCallback, useEffect, useRef } from "react";
import { useAccelerometerListener } from "../hooks/use-accelerometer-listener";
import { useDataConnected } from "../data-connection-flow";
import { useGraphColors } from "../hooks/use-graph-colors";
import { maxAccelerationScaleForGraphs } from "../mlConfig";
import { useSettings, useStore } from "../store";
import { useGraphLineStyles } from "../hooks/use-graph-line-styles";

export const smoothenDataPoint = (curr: number, next: number) => {
  // TODO: Factor out so that recording graph can do the same
  // Remove dividing by 1000 operation once it gets moved to connection lib
  return (next / 1000) * 0.25 + curr * 0.75;
};

const bufferCapacity = 1024;
const millisPerPixel = 7;
const gridMillisPerLine = 3000;
const gridStroke = "rgba(48,48,48,0.20)";
const gridLineWidth = 2;
const gridVerticalSections = 2;
const recordingFill = "rgba(0, 0, 255, 0.03)";
const recordingStroke = "rgba(64, 64, 255, 0.27)";
const recordingLineWidth = 2;
const labelAreaWidth = 38;
const labelFontSize = "20px";
const labelMinSpacing = 24;

interface RecordingRegion {
  start: number;
  end: number | null;
}

interface RingBuffer {
  timestamps: Float64Array;
  valuesX: Float64Array;
  valuesY: Float64Array;
  valuesZ: Float64Array;
  head: number;
  count: number;
}

function createRingBuffer(): RingBuffer {
  return {
    timestamps: new Float64Array(bufferCapacity),
    valuesX: new Float64Array(bufferCapacity),
    valuesY: new Float64Array(bufferCapacity),
    valuesZ: new Float64Array(bufferCapacity),
    head: 0,
    count: 0,
  };
}

function appendToBuffer(
  buf: RingBuffer,
  t: number,
  x: number,
  y: number,
  z: number
) {
  buf.timestamps[buf.head] = t;
  buf.valuesX[buf.head] = x;
  buf.valuesY[buf.head] = y;
  buf.valuesZ[buf.head] = z;
  buf.head = (buf.head + 1) % bufferCapacity;
  if (buf.count < bufferCapacity) buf.count++;
}

/** Read the i-th point (0 = oldest). */
function bufferIndex(buf: RingBuffer, i: number): number {
  return (buf.head - buf.count + i + bufferCapacity) % bufferCapacity;
}

function valueToY(value: number, height: number): number {
  const range = maxAccelerationScaleForGraphs * 2;
  return height * (1 - (value + maxAccelerationScaleForGraphs) / range);
}

function timeToX(t: number, now: number, width: number): number {
  return width - (now - t) / millisPerPixel;
}

interface LabelEntry {
  label: string;
  color: string;
  y: number;
  adjustedY: number;
}

function fixOverlappingLabels(labels: LabelEntry[]): void {
  labels.sort((a, b) => a.y - b.y);

  // Start with unadjusted positions.
  for (const l of labels) l.adjustedY = l.y;

  const d01 = labels[1].adjustedY - labels[0].adjustedY;
  const d12 = labels[2].adjustedY - labels[1].adjustedY;
  const d02 = labels[2].adjustedY - labels[0].adjustedY;

  if (d02 < labelMinSpacing * 2) {
    // All three too close — spread evenly around midpoint.
    const mid = labels[0].adjustedY + d02 / 2;
    labels[0].adjustedY = mid - labelMinSpacing;
    labels[1].adjustedY = mid;
    labels[2].adjustedY = mid + labelMinSpacing;
  } else if (d01 < labelMinSpacing) {
    const mid = labels[0].adjustedY + d01 / 2;
    labels[0].adjustedY = mid - labelMinSpacing / 2;
    labels[1].adjustedY = mid + labelMinSpacing / 2;
  } else if (d12 < labelMinSpacing) {
    const mid = labels[1].adjustedY + d12 / 2;
    labels[1].adjustedY = mid - labelMinSpacing / 2;
    labels[2].adjustedY = mid + labelMinSpacing / 2;
  }
}

function drawLabels(
  ctx: CanvasRenderingContext2D,
  buf: RingBuffer,
  width: number,
  height: number,
  colors: { x: string; y: string; z: string },
  fontFamily: string
) {
  if (buf.count === 0) return;

  const latest = bufferIndex(buf, buf.count - 1);
  const labels: LabelEntry[] = [
    {
      label: "x",
      color: colors.x,
      y: valueToY(buf.valuesX[latest], height),
      adjustedY: 0,
    },
    {
      label: "y",
      color: colors.y,
      y: valueToY(buf.valuesY[latest], height),
      adjustedY: 0,
    },
    {
      label: "z",
      color: colors.z,
      y: valueToY(buf.valuesZ[latest], height),
      adjustedY: 0,
    },
  ];
  fixOverlappingLabels(labels);

  const graphWidth = width - labelAreaWidth;
  ctx.font = `${labelFontSize} ${fontFamily}`;
  ctx.textBaseline = "middle";

  const arrowWidth = 9;
  const arrowHeight = 16;
  const arrowX = graphWidth;
  const textCenterX = arrowX + arrowWidth + (width - arrowX - arrowWidth) / 2;
  ctx.textAlign = "center";

  for (const l of labels) {
    // Arrow points at the actual line position (l.y), not the adjusted text position.
    ctx.fillStyle = l.color;
    ctx.beginPath();
    ctx.moveTo(arrowX, l.y);
    ctx.lineTo(arrowX + arrowWidth, l.y - arrowHeight / 2);
    ctx.lineTo(arrowX + arrowWidth, l.y + arrowHeight / 2);
    ctx.closePath();
    ctx.fill();

    // Text uses adjusted position to avoid overlap.
    ctx.fillStyle = l.color;
    ctx.fillText(l.label, textCenterX, l.adjustedY);
  }
}

interface AxisConfig {
  values: Float64Array;
  color: string;
  lineWidth: number;
  lineDash: number[] | undefined;
  dashOffset: number;
}

function render(
  ctx: CanvasRenderingContext2D,
  buf: RingBuffer,
  width: number,
  height: number,
  now: number,
  regions: RecordingRegion[],
  axes: AxisConfig[],
  colors: { x: string; y: string; z: string },
  prevFirstVisible: number,
  fontFamily: string
) {
  // Clear.
  ctx.clearRect(0, 0, width, height);

  // Reserve right side for labels; data draws within graphWidth.
  const graphWidth = width - labelAreaWidth;
  const oldestVisibleTime = now - graphWidth * millisPerPixel;

  // Find the first visible point and accumulate dash offsets for any
  // segments that have scrolled off since the previous frame.
  let firstVisible = 0;
  for (let i = 0; i < buf.count; i++) {
    if (buf.timestamps[bufferIndex(buf, i)] >= oldestVisibleTime) {
      firstVisible = i;
      break;
    }
  }
  if (prevFirstVisible >= 0 && firstVisible > prevFirstVisible) {
    for (let i = prevFirstVisible; i < firstVisible; i++) {
      const idxA = bufferIndex(buf, i);
      const idxB = bufferIndex(buf, i + 1);
      const dx = (buf.timestamps[idxB] - buf.timestamps[idxA]) / millisPerPixel;
      for (const axis of axes) {
        if (!axis.lineDash) continue;
        const dy =
          valueToY(axis.values[idxB], height) -
          valueToY(axis.values[idxA], height);
        const segLen = Math.sqrt(dx * dx + dy * dy);
        const totalDash = axis.lineDash[0] + axis.lineDash[1];
        axis.dashOffset = (axis.dashOffset + segLen) % totalDash;
      }
    }
  }

  // Grid: vertical time lines.
  ctx.strokeStyle = gridStroke;
  ctx.lineWidth = gridLineWidth;
  ctx.beginPath();
  for (
    let t = now - (now % gridMillisPerLine);
    t >= oldestVisibleTime;
    t -= gridMillisPerLine
  ) {
    const x = timeToX(t, now, graphWidth);
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
  }
  ctx.stroke();

  // Grid: horizontal section dividers.
  ctx.beginPath();
  for (let v = 1; v < gridVerticalSections; v++) {
    const y = Math.round((v * height) / gridVerticalSections) + 0.5;
    ctx.moveTo(0, y);
    ctx.lineTo(graphWidth, y);
  }
  ctx.stroke();

  // Recording regions.
  for (const region of regions) {
    const startX = timeToX(region.start, now, graphWidth);
    const endX =
      region.end !== null ? timeToX(region.end, now, graphWidth) : graphWidth;
    if (endX < 0 || startX > graphWidth) continue;

    const clampedStart = Math.max(0, startX);
    const clampedEnd = Math.min(graphWidth, endX);

    // Fill.
    ctx.fillStyle = recordingFill;
    ctx.fillRect(clampedStart, 0, clampedEnd - clampedStart, height);

    // Boundary lines.
    ctx.strokeStyle = recordingStroke;
    ctx.lineWidth = recordingLineWidth;
    ctx.beginPath();
    if (startX >= 0 && startX <= graphWidth) {
      ctx.moveTo(startX, 0);
      ctx.lineTo(startX, height);
    }
    if (region.end !== null && endX >= 0 && endX <= graphWidth) {
      ctx.moveTo(endX, 0);
      ctx.lineTo(endX, height);
    }
    ctx.stroke();
  }

  // Data lines — clip to graph area.
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, graphWidth, height);
  ctx.clip();
  for (const axis of axes) {
    if (buf.count < 2) continue;

    ctx.strokeStyle = axis.color;
    ctx.lineWidth = axis.lineWidth;
    if (axis.lineDash) {
      ctx.setLineDash(axis.lineDash);
    } else {
      ctx.setLineDash([]);
    }

    if (axis.lineDash) {
      ctx.lineDashOffset = axis.dashOffset;
    }

    ctx.beginPath();
    let started = false;
    let lastY = 0;
    for (let i = 0; i < buf.count; i++) {
      const idx = bufferIndex(buf, i);
      const t = buf.timestamps[idx];
      if (t < oldestVisibleTime) continue;
      const x = timeToX(t, now, graphWidth);
      const y = valueToY(axis.values[idx], height);
      if (!started) {
        ctx.moveTo(x, y);
        started = true;
      } else {
        ctx.lineTo(x, y);
      }
      lastY = y;
    }
    // Extend to right edge at last known value to avoid stick-then-jump.
    // Skip for dashed lines as the changing extension length causes dash jitter.
    if (started && !axis.lineDash) {
      ctx.lineTo(graphWidth, lastY);
    }
    ctx.stroke();
    ctx.setLineDash([]);
  }
  ctx.restore();

  // Labels in the reserved right area.
  drawLabels(ctx, buf, width, height, colors, fontFamily);

  return firstVisible;
}

interface LiveGraphProps {
  paused?: boolean;
}

const LiveGraph = ({ paused }: LiveGraphProps) => {
  const isConnected = useDataConnected();
  const [{ graphColorScheme, graphLineScheme, graphLineWeight }] =
    useSettings();

  const [fontFamily] = useToken("fonts", ["body"]);
  const colors = useGraphColors(graphColorScheme);
  const lineStyles = useGraphLineStyles(graphLineScheme);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef(null);
  const { width, height } = useSize(containerRef) ?? {
    width: 100,
    height: 100,
  };

  const lineWidth = graphLineWeight === "default" ? 2 : 3;

  // Stable refs for render loop access without re-creating the loop.
  const bufferRef = useRef<RingBuffer>(createRingBuffer());
  const regionsRef = useRef<RecordingRegion[]>([]);
  const colorsRef = useRef(colors);
  colorsRef.current = colors;
  const lineStylesRef = useRef(lineStyles);
  lineStylesRef.current = lineStyles;
  const lineWidthRef = useRef(lineWidth);
  lineWidthRef.current = lineWidth;
  const fontFamilyRef = useRef(fontFamily);
  fontFamilyRef.current = fontFamily;

  // Recording region tracking.
  const isRecording = useStore((s) => s.isRecording);
  const wasRecordingRef = useRef(false);
  useEffect(() => {
    const wasRecording = wasRecordingRef.current;
    wasRecordingRef.current = isRecording;
    if (isRecording && !wasRecording) {
      regionsRef.current.push({ start: Date.now(), end: null });
    } else if (!isRecording && wasRecording) {
      const regions = regionsRef.current;
      const open = regions.find((r) => r.end === null);
      if (open) open.end = Date.now();
    }
  }, [isRecording]);

  // Accelerometer data listener — single path for both graph and labels.
  const smoothedRef = useRef({ x: 0, y: 0, z: 0 });
  const accelerometerListener = useCallback(
    (data: AccelerometerData) => {
      const s = smoothedRef.current;
      s.x = smoothenDataPoint(s.x, data.x);
      s.y = smoothenDataPoint(s.y, data.y);
      s.z = smoothenDataPoint(s.z, data.z);
      appendToBuffer(bufferRef.current, Date.now(), s.x, s.y, s.z);
    },
    []
  );
  useAccelerometerListener(accelerometerListener);

  // Animation loop.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !isConnected || paused) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let frameId: number;
    let lastRenderTime = 0;
    let prevFirstVisible = -1;
    const axisConfigs: AxisConfig[] = [
      {
        values: null!,
        color: "",
        lineWidth: 0,
        lineDash: undefined,
        dashOffset: 0,
      },
      {
        values: null!,
        color: "",
        lineWidth: 0,
        lineDash: undefined,
        dashOffset: 0,
      },
      {
        values: null!,
        color: "",
        lineWidth: 0,
        lineDash: undefined,
        dashOffset: 0,
      },
    ];

    const animate = () => {
      frameId = requestAnimationFrame(animate);

      const now = Date.now();
      // Skip if less than one pixel of movement since last render.
      if (now - lastRenderTime < millisPerPixel) return;
      lastRenderTime = now;

      const w = canvas.width;
      const h = canvas.height;
      if (w === 0 || h === 0) return;

      const buf = bufferRef.current;
      const c = colorsRef.current;
      const ls = lineStylesRef.current;
      const lw = lineWidthRef.current;

      // Clean up off-screen recording regions.
      const oldestVisible = now - w * millisPerPixel;
      regionsRef.current = regionsRef.current.filter(
        (r) => r.end === null || r.end > oldestVisible
      );

      // Update channel configs in place to preserve dashOffset across frames.
      axisConfigs[0].values = buf.valuesX;
      axisConfigs[0].color = c.x;
      axisConfigs[0].lineWidth = lw;
      axisConfigs[0].lineDash = ls.x;
      axisConfigs[1].values = buf.valuesY;
      axisConfigs[1].color = c.y;
      axisConfigs[1].lineWidth = lw;
      axisConfigs[1].lineDash = ls.y;
      axisConfigs[2].values = buf.valuesZ;
      axisConfigs[2].color = c.z;
      axisConfigs[2].lineWidth = lw;
      axisConfigs[2].lineDash = ls.z;

      prevFirstVisible = render(
        ctx,
        buf,
        w,
        h,
        now,
        regionsRef.current,
        axisConfigs,
        c,
        prevFirstVisible,
        fontFamilyRef.current
      );
    };

    frameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameId);
  }, [isConnected, paused]);

  return (
    <Box ref={containerRef} width="100%" height="100%" overflow="hidden">
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        id="smoothie-chart"
      />
    </Box>
  );
};

export default LiveGraph;
