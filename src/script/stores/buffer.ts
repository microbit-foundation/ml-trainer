/**
 * (c) 2023, Center for Computational Thinking and Design at Aarhus University and contributors
 *
 * SPDX-License-Identifier: MIT
 */

export type SamplesByAxis = { x: number[]; y: number[]; z: number[] };

export class SampleRingBuffer {
  private x: number[];
  private y: number[];
  private z: number[];

  private last: number = -1;
  private full = false;

  private recordingSnapshotIndex: number = -1;
  private recordingResolve: ((snapshot: SamplesByAxis) => void) | undefined = undefined;

  constructor(private size: number) {
    this.x = new Array(size);
    this.y = new Array(size);
    this.z = new Array(size);
  }

  write(x: number, y: number, z: number) {
    const next = (this.last + 1) % this.size;
    this.x[next] = x;
    this.y[next] = y;
    this.z[next] = z;
    this.last = next;
    if (this.last === this.size - 1) {
      this.full = true;
    }
    if (this.last === this.recordingSnapshotIndex && this.recordingResolve) {
      this.recordingResolve(this.toSnapshot()!);
    }
  }

  record(): Promise<SamplesByAxis> {
    this.recordingSnapshotIndex = this.last;
    return new Promise(resolve => {
      this.recordingResolve = resolve;
    });
  }

  isFull() {
    return this.full;
  }

  toSnapshot(): SamplesByAxis | undefined {
    if (!this.isFull()) {
      return undefined;
    }
    const x = new Array(this.size);
    const y = new Array(this.size);
    const z = new Array(this.size);

    let target = 0;
    for (let i = this.last + 1; i < this.size; ++i, ++target) {
      x[target] = this.x[i];
      y[target] = this.y[i];
      z[target] = this.z[i];
    }
    for (let i = 0; i <= this.last; ++i, ++target) {
      x[target] = this.x[i];
      y[target] = this.y[i];
      z[target] = this.z[i];
    }
    return { x, y, z };
  }
}
