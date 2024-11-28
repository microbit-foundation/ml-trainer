/**
 * (c) 2023, Center for Computational Thinking and Design at Aarhus University and contributors
 *
 * SPDX-License-Identifier: MIT
 */

import { ChartConfiguration, ChartTypeRegistry } from "chart.js";
import {
  GraphLineStyles,
  graphLineStyleStringToArray,
} from "./hooks/use-graph-line-styles";
import { maxAccelerationScaleForGraphs } from "./mlConfig";
import { XYZData } from "./model";
import { GraphLineWeight } from "./settings";

const smoothen = (d: number[]): number[] => {
  if (d.length === 0) {
    return d;
  }
  const newData: number[] = [];
  let prevValue = d[0];
  d.forEach((v) => {
    const newValue = v * 0.25 + prevValue * 0.75;
    newData.push(newValue);
    prevValue = newValue;
  });
  return newData;
};

// Smoothen data
export function smoothenXYZData(d: XYZData): XYZData {
  return {
    x: smoothen(d.x),
    y: smoothen(d.y),
    z: smoothen(d.z),
  };
}

interface Pos {
  x: number;
  y: number;
}

const processDimensionData = (data: number[]) => {
  const formatToChartPos = (y: number, idx: number) => ({ x: idx, y });
  return smoothen(data).map(formatToChartPos);
};

interface GraphColors {
  x: string;
  y: string;
  z: string;
}

export const getConfig = (
  { x: rawX, y: rawY, z: rawZ }: XYZData,
  responsive: boolean,
  colors: GraphColors,
  lineStyles: GraphLineStyles,
  graphLineWeight: GraphLineWeight
): ChartConfiguration<keyof ChartTypeRegistry, Pos[], string> => {
  const x = processDimensionData(rawX);
  const y = processDimensionData(rawY);
  const z = processDimensionData(rawZ);
  const common = {
    borderWidth:
      graphLineWeight === "normal" ? 1.5 : graphLineWeight === "thin" ? 1 : 2.5,
    pointRadius: 0,
    pointHoverRadius: 0,
  };
  return {
    type: "line",
    data: {
      datasets: [
        {
          ...common,
          label: "x",
          borderColor: colors.x,
          borderDash: graphLineStyleStringToArray(lineStyles.x) ?? [],
          data: x,
        },
        {
          ...common,
          label: "y",
          borderColor: colors.y,
          borderDash: graphLineStyleStringToArray(lineStyles.y) ?? [],
          data: y,
        },
        {
          ...common,
          label: "z",
          borderColor: colors.z,
          borderDash: graphLineStyleStringToArray(lineStyles.z) ?? [],
          data: z,
        },
      ],
    },
    options: {
      animation: false,
      responsive,
      maintainAspectRatio: false,
      interaction: {
        // @ts-expect-error null disables interaction - the type information is wrong.
        mode: null,
      },
      hover: {
        // @ts-expect-error null disables hover - the type information is wrong.
        mode: null,
      },
      normalized: true,
      parsing: false,
      scales: {
        x: {
          type: "linear",
          min: 0,
          // We start at zero.
          max: rawX.length - 1,
          grid: {
            drawTicks: false,
            display: false,
          },
          ticks: {
            display: false, //this will remove only the label
          },
          display: false,
        },
        y: {
          type: "linear",
          min: -maxAccelerationScaleForGraphs,
          max: maxAccelerationScaleForGraphs,
          grid: {
            drawTicks: false,
            display: false,
          },
          ticks: {
            display: false, //this will remove only the label
          },
          display: false,
        },
      },
      plugins: {
        legend: {
          display: false,
        },
        title: {
          display: false,
        },
      },
    },
  };
};
