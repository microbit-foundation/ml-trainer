/**
 * (c) 2024, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { useRef } from "react";

interface PromiseCallbacks<T> {
  resolve: (value: T | PromiseLike<T>) => void;
  reject: (reason?: unknown) => void;
}

interface PromiseInfo<T> extends PromiseCallbacks<T> {
  promise: Promise<T>;
}

const createPromise = <T>(): PromiseInfo<T> => {
  let callbacks: PromiseCallbacks<T> | undefined;
  const promise = new Promise<T>((resolve, reject) => {
    callbacks = { resolve, reject };
  });
  if (callbacks === undefined) {
    throw new Error();
  }
  return { promise, ...callbacks };
};

export const usePromiseRef = <T>() => {
  const ref = useRef<PromiseInfo<T> | null>(null);
  if (!ref.current) {
    ref.current = createPromise<T>();
    ref.current.promise = ref.current.promise.then((res) => {
      // Reset promise after promise resolves.
      ref.current = createPromise<T>();
      return res;
    });
  }
  return ref as { current: PromiseInfo<T> };
};
