/**
 * @vitest-environment jsdom
 */
/**
 * (c) 2023, Center for Computational Thinking and Design at Aarhus University and contributors
 *
 * SPDX-License-Identifier: MIT
 */

import { getPrediction } from '../script/getPrediction';
import { GestureData, getNewMatrix } from '../script/stores/mlStore';

interface GestureConfig {
  name: string;
  currentConfidence: number;
  requiredConfidence: number;
}

const createGesture = (g: GestureConfig): GestureData => ({
  name: g.name,
  ID: 1,
  matrix: getNewMatrix(),
  recordings: [],
  output: {},
  confidence: {
    currentConfidence: g.currentConfidence,
    requiredConfidence: g.requiredConfidence,
    isConfident: g.currentConfidence >= g.requiredConfidence,
  },
});

describe('getPrediction', () => {
  test('1 gesture, under required confidence', () => {
    const gesture1 = createGesture({
      name: 'gesture 1',
      currentConfidence: 0.7,
      requiredConfidence: 0.9,
    });
    expect(getPrediction([gesture1])).toEqual(undefined);
  });
  test('1 gesture, over required confidence', () => {
    const gesture1 = createGesture({
      name: 'gesture 1',
      currentConfidence: 0.7,
      requiredConfidence: 0.5,
    });
    expect(getPrediction([gesture1])).toEqual(gesture1);
  });
  test('>1 gesture, one over required confidence', () => {
    const gesture1 = createGesture({
      name: 'gesture 1',
      currentConfidence: 0.7,
      requiredConfidence: 0.5,
    });
    const gesture2 = createGesture({
      name: 'gesture 2',
      currentConfidence: 0.7,
      requiredConfidence: 0.8,
    });
    expect(getPrediction([gesture1, gesture2])).toEqual(gesture1);
  });
  test('>1 gesture, both over required confidence', () => {
    const gesture1 = createGesture({
      name: 'gesture 1',
      currentConfidence: 0.7,
      requiredConfidence: 0.5,
    });
    const gesture2 = createGesture({
      name: 'gesture 2',
      currentConfidence: 0.9,
      requiredConfidence: 0.8,
    });
    expect(getPrediction([gesture1, gesture2])).toEqual(gesture2);
  });
  test('>1 gesture, both under required confidence', () => {
    const gesture1 = createGesture({
      name: 'gesture 1',
      currentConfidence: 0.4,
      requiredConfidence: 0.5,
    });
    const gesture2 = createGesture({
      name: 'gesture 2',
      currentConfidence: 0.3,
      requiredConfidence: 0.8,
    });
    expect(getPrediction([gesture1, gesture2])).toEqual(undefined);
  });
});
