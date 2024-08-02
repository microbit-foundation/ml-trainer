import { AccelerometerDataEvent } from "@microbit/microbit-connection";
import { XYZData } from "./gestures-hooks";

interface TimedXYZ {
  x: number;
  y: number;
  z: number;
  timestamp: number;
}

export class BufferedData {
  private buffer: RingBuffer<TimedXYZ>;
  private lastTimestamp: number = 0;

  constructor(size: number) {
    this.buffer = new RingBuffer<TimedXYZ>(size);
  }

  addSample(data: AccelerometerDataEvent["data"], timestamp: number) {
    this.buffer.add({ ...data, timestamp });
    console.log(timestamp - this.lastTimestamp);
    this.lastTimestamp = timestamp;
  }

  getSamples(startTimeMillis: number): XYZData {
    const ordered = this.buffer.toArray();
    const result: XYZData = { x: [], y: [], z: [] };
    // Go backwards until we have `duration` of samples
    let start: number;
    for (
      start = ordered.length - 1;
      start >= 0 && ordered[start].timestamp >= startTimeMillis;
      start--
    ) {
      /* empty */
    }

    for (let i = start + 1; i < ordered.length; ++i) {
      result.x.push(ordered[i].x);
      result.y.push(ordered[i].y);
      result.z.push(ordered[i].z);
    }
    return result;
  }
}

export class RingBuffer<T> {
  private buffer: T[];
  private pos: number = 0;
  size: number = 0;

  constructor(size: number) {
    this.buffer = new Array<T>(size);
  }

  add(value: T) {
    this.buffer[this.pos] = value;
    if (this.size < this.pos + 1) {
      this.size = this.pos + 1;
    }
    this.pos = (this.pos + 1) % this.buffer.length;
  }

  toArray() {
    if (this.size === 0) {
      return [];
    }
    if (this.size < this.buffer.length) {
      return this.buffer.slice(0, this.size);
    }
    return this.buffer.slice(this.pos).concat(this.buffer.slice(0, this.pos));
  }
}
