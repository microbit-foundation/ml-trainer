/**
 * (c) 2023, Center for Computational Thinking and Design at Aarhus University and contributors
 *
 * SPDX-License-Identifier: MIT
 */

import { ChartConfiguration, ChartTypeRegistry } from "chart.js";
import { XYZData } from "./model";

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

export const getConfig = ({
  x: rawX,
  y: rawY,
  z: rawZ,
}: XYZData): ChartConfiguration<keyof ChartTypeRegistry, Pos[], string> => {
  const x = processDimensionData(rawX);
  const y = processDimensionData(rawY);
  const z = processDimensionData(rawZ);
  return {
    type: "line",
    data: {
      datasets: [
        {
          label: "x",
          borderColor: "red",
          borderWidth: 1,
          pointRadius: 0,
          pointHoverRadius: 0,
          data: x,
        },
        {
          label: "y",
          borderColor: "green",
          borderWidth: 1,
          pointRadius: 0,
          pointHoverRadius: 0,
          data: y,
        },
        {
          label: "z",
          borderColor: "blue",
          borderWidth: 1,
          pointRadius: 0,
          pointHoverRadius: 0,
          data: z,
        },
      ],
    },
    options: {
      animation: false,
      responsive: false,
      maintainAspectRatio: false,

      interaction: {
        intersect: false,
        mode: "index",
      },
      scales: {
        x: {
          type: "linear",
          min: 0,
          max: rawX.length,
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
          min: -2.5,
          max: 2.5,
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
