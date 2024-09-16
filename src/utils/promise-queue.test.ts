/* eslint-disable @typescript-eslint/require-await */
import { describe, expect, it } from "vitest";
import { PromiseQueue } from "./promise-queue.js";

describe("PromiseQueue", () => {
  it("waits for previous items", async () => {
    const sequence: number[] = [];
    const queue = new PromiseQueue();
    void queue.add(async () => {
      expect(sequence).toEqual([]);
      sequence.push(1);
    });
    void queue.add(async () => {
      expect(sequence).toEqual([1]);
      sequence.push(2);
    });
    expect(
      await queue.add(async () => {
        expect(sequence).toEqual([1, 2]);
        sequence.push(3);
        return 3;
      })
    ).toEqual(3);
    expect(sequence).toEqual([1, 2, 3]);
  });

  it("copes with errors", async () => {
    const queue = new PromiseQueue();
    const sequence: (number | Error)[] = [];
    const p1 = queue.add(() => {
      sequence.push(1);
      throw new Error("Oops");
    });
    const p2 = queue.add(() => {
      sequence.push(2);
      return Promise.resolve(2);
    });
    expect(await p2).toEqual(2);
    await expect(p1).rejects.toThrow("Oops");
    expect(sequence).toEqual([1, 2]);
  });

  it("clears", async () => {
    const queue = new PromiseQueue();
    const rejected: Promise<unknown>[] = [];
    const p1 = queue.add(
      () => new Promise((resolve) => setTimeout(resolve, 1000))
    );
    const p2 = queue.add(
      () => new Promise((resolve) => setTimeout(resolve, 1000))
    );
    const p3 = queue.add(
      () => new Promise((resolve) => setTimeout(resolve, 1000))
    );
    p1.catch(() => rejected.push(p1));
    p2.catch(() => rejected.push(p2));
    p3.catch(() => rejected.push(p3));
    queue.clear(() => new Error("Cleared!"));
    await expect(p2).rejects.toThrow("Cleared!");
    await expect(p3).rejects.toThrow("Cleared!");
    expect(rejected).toEqual([p2, p3]);
  });

  it("detects abort", async () => {
    let abort = false;
    const queue = new PromiseQueue({
      abortCheck: () => (abort ? () => new Error("Aborted") : undefined),
    });
    const p1 = queue.add(async () => {
      abort = true;
    });
    const p2 = queue.add(async () => {
      throw new Error("Does not happen");
    });
    expect(await p1).toBeUndefined();
    await expect(p2).rejects.toThrow("Aborted");
  });
});
