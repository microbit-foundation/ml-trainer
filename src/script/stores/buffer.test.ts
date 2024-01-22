/**
 * @jest-environment jsdom
 */
/**
 * (c) 2023, Center for Computational Thinking and Design at Aarhus University and contributors
 *
 * SPDX-License-Identifier: MIT
 */

import { SampleRingBuffer } from './buffer';

describe('SampleRingBuffer', () => {
  it('is initially empty', () => {
    const b = new SampleRingBuffer(3);
    expect(b.isFull()).toEqual(false);
    expect(b.toSnapshot()).toBeUndefined();
  });
  it('isFull', () => {
    const b = new SampleRingBuffer(3);
    b.write(0, 0, 0);
    b.write(0, 0, 0);
    expect(b.isFull()).toEqual(false);
    b.write(0, 0, 0);
    expect(b.isFull()).toEqual(true);
  });
  it('toSnapshot full simple case', () => {
    const b = new SampleRingBuffer(3);
    b.write(1, 0, 0);
    b.write(0, 1, 0);
    b.write(0, 0, 1);
    expect(b.toSnapshot()).toEqual({
      x: [1, 0, 0],
      y: [0, 1, 0],
      z: [0, 0, 1],
    });
  });
  it('toSnapshot wrap around case', () => {
    const b = new SampleRingBuffer(3);
    b.write(1, 0, 0);
    b.write(0, 1, 0);
    b.write(0, 0, 1);
    b.write(1, 1, 1);

    expect(b.toSnapshot()).toEqual({
      x: [0, 0, 1],
      y: [1, 0, 1],
      z: [0, 1, 1],
    });
  });
  it('records', async () => {
    const b = new SampleRingBuffer(3);
    b.write(1, 0, 0);
    b.write(0, 1, 0);
    b.write(0, 0, 1);
    const events: number[] = [];
    const recordPromise = b.record(n => events.push(n));
    b.write(1, 1, 1);
    b.write(1, 1, 1);
    b.write(1, 1, 1);

    const result = await recordPromise;
    expect(result).toEqual({
      x: [1, 1, 1],
      y: [1, 1, 1],
      z: [1, 1, 1],
    });
    expect(events).toEqual([0, 1, 2]);
  });
});
