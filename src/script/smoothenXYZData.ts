/**
 * (c) 2023, Center for Computational Thinking and Design at Aarhus University and contributors
 *
 * SPDX-License-Identifier: MIT
 */

interface XYZData {
  x: number[];
  y: number[];
  z: number[];
}

const smoothAxisData = (d: number[]): number[] => {
  if (d.length === 0) {
    return d;
  }
  const newData: number[] = [];
  let prevValue = d[0];
  d.forEach(v => {
    const newValue = v * 0.25 + prevValue * 0.75;
    newData.push(newValue);
    prevValue = newValue;
  });
  return newData;
};

// Smoothen data
export function smoothXYZData(d: XYZData): XYZData {
  return {
    x: smoothAxisData(d.x),
    y: smoothAxisData(d.y),
    z: smoothAxisData(d.z),
  };
}
