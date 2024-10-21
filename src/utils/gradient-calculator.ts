/**
 * (c) 2024, Center for Computational Thinking and Design at Aarhus University and contributors
 *
 * SPDX-License-Identifier: MIT
 */

interface RGB {
  r: number;
  g: number;
  b: number;
}

export const calculateColor = (
  value: number,
  startColor: RGB,
  endColor: RGB
) => {
  const diff = {
    r: endColor.r - startColor.r,
    g: endColor.g - startColor.g,
    b: endColor.b - startColor.b,
  };
  return `rgba(${startColor.r + diff.r * value}, ${
    startColor.g + diff.g * value
  }, ${startColor.b + diff.b * value}, 1)`;
};
