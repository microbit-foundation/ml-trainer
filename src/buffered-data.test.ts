import { describe, it } from "vitest";
import { BufferedData, RingBuffer } from "./buffered-data";

describe("RingBuffer", () => {
  it("toArray empty", () => {
    const buffer = new RingBuffer(5);
    expect(buffer.size).toEqual(0);
    expect(buffer.toArray()).toEqual([]);
  });
  it("toArray part full", () => {
    const buffer = new RingBuffer<number>(5);
    buffer.add(1);
    expect(buffer.size).toEqual(1);
    buffer.add(2);
    expect(buffer.size).toEqual(2);
    expect(buffer.toArray()).toEqual([1, 2]);
  });
  it("toArray full", () => {
    const buffer = new RingBuffer<number>(3);
    buffer.add(1);
    buffer.add(2);
    buffer.add(3);
    expect(buffer.size).toEqual(3);
    expect(buffer.toArray()).toEqual([1, 2, 3]);
  });
  it("toArray wrap", () => {
    const buffer = new RingBuffer<number>(3);
    buffer.add(1);
    buffer.add(2);
    buffer.add(3);
    buffer.add(4);
    expect(buffer.toArray()).toEqual([2, 3, 4]);
  });
});

describe("BufferedData", () => {
  it("picks by timestamp", () => {
    const buffer = new BufferedData(10);
    buffer.addSample({ x: 0, y: 0, z: 0 }, 0);
    buffer.addSample({ x: 1, y: 0, z: 0 }, 10);
    buffer.addSample({ x: 2, y: 0, z: 0 }, 20);
    buffer.addSample({ x: 3, y: 0, z: 0 }, 30);
    expect(buffer.getSamples(0)).toEqual({
      x: [0, 1, 2, 3],
      y: [0, 0, 0, 0],
      z: [0, 0, 0, 0],
    });
    expect(buffer.getSamples(1)).toEqual({
      x: [1, 2, 3],
      y: [0, 0, 0],
      z: [0, 0, 0],
    });
    expect(buffer.getSamples(9)).toEqual({
      x: [1, 2, 3],
      y: [0, 0, 0],
      z: [0, 0, 0],
    });
    expect(buffer.getSamples(10)).toEqual({
      x: [1, 2, 3],
      y: [0, 0, 0],
      z: [0, 0, 0],
    });
    expect(buffer.getSamples(11)).toEqual({
      x: [2, 3],
      y: [0, 0],
      z: [0, 0],
    });
  });

  it("copes when full/wrapping", () => {
    const buffer = new BufferedData(3);
    buffer.addSample({ x: 0, y: 0, z: 0 }, 0);
    buffer.addSample({ x: 1, y: 0, z: 0 }, 10);
    buffer.addSample({ x: 2, y: 0, z: 0 }, 20);
    buffer.addSample({ x: 3, y: 0, z: 0 }, 30);
    expect(buffer.getSamples(0)).toEqual({
      x: [1, 2, 3],
      y: [0, 0, 0],
      z: [0, 0, 0],
    });
  });

  it("copes when full/wrapping 2", () => {
    const buffer = new BufferedData(3);
    buffer.addSample({ x: 0, y: 0, z: 0 }, 0);
    buffer.addSample({ x: 1, y: 0, z: 0 }, 10);
    buffer.addSample({ x: 2, y: 0, z: 0 }, 20);
    buffer.addSample({ x: 3, y: 0, z: 0 }, 30);
    buffer.addSample({ x: 4, y: 0, z: 0 }, 40);
    expect(buffer.getSamples(40)).toEqual({
      x: [4],
      y: [0],
      z: [0],
    });
    expect(buffer.getSamples(30)).toEqual({
      x: [3, 4],
      y: [0, 0],
      z: [0, 0],
    });
    expect(buffer.getSamples(20)).toEqual({
      x: [2, 3, 4],
      y: [0, 0, 0],
      z: [0, 0, 0],
    });
    expect(buffer.getSamples(10)).toEqual({
      x: [2, 3, 4],
      y: [0, 0, 0],
      z: [0, 0, 0],
    });

    buffer.addSample({ x: 5, y: 0, z: 0 }, 50);
    buffer.addSample({ x: 6, y: 0, z: 0 }, 60);
    expect(buffer.getSamples(10)).toEqual({
      x: [4, 5, 6],
      y: [0, 0, 0],
      z: [0, 0, 0],
    });
  });

  it("returns nothing when it has nothing since start time", () => {
    const buffer = new BufferedData(3);
    buffer.addSample({ x: 0, y: 0, z: 0 }, 0);
    expect(buffer.getSamples(10)).toEqual({
      x: [],
      y: [],
      z: [],
    });
  });
});
