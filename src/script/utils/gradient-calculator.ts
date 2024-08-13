/**
 * (c) 2024, Center for Computational Thinking and Design at Aarhus University and contributors
 *
 * SPDX-License-Identifier: MIT
 */

const start = {
  r: 239,
  g: 249,
  b: 189,
};

const end = {
  r: 28,
  g: 49,
  b: 133,
};

const diff = {
  r: end.r - start.r,
  g: end.g - start.g,
  b: end.b - start.b,
};

export const calculateColor = (value: number) =>
  `rgba(${start.r + diff.r * value}, ${start.g + diff.g * value}, ${
    start.b + diff.b * value
  }, 1)`;
