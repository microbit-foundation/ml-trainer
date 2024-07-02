/**
 * @vitest-environment jsdom
 */
/**
 * (c) 2023, Center for Computational Thinking and Design at Aarhus University and contributors
 *
 * SPDX-License-Identifier: MIT
 */

import { smoothXYZData } from '../script/smoothenXYZData';

describe('smoothenXYZData', () => {
  test('smoothen empty data', () => {
    const xyz = {
      x: [],
      y: [],
      z: [],
    };
    expect(smoothXYZData(xyz)).toEqual(xyz);
  });
  test('smoothen xyz data', () => {
    const xyz = {
      x: [1, 1, 1, 1, 1],
      y: [4, 4, 12, 10, 10],
      z: [8, 8, 24, 20, 20],
    };
    const smoothedXYZData = {
      x: [1, 1, 1, 1, 1],
      y: [4, 4, 6, 7, 7.75],
      z: [8, 8, 12, 14, 15.5],
    };
    expect(smoothXYZData(xyz)).toEqual(smoothedXYZData);
  });
});
