/**
 * (c) 2026, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
} from "react";

interface AnimationContextValue {
  delayInSec: (sec: number) => Promise<void>;
  restart: () => void;
}

export const AnimationContext = createContext<AnimationContextValue | null>(
  null
);

export const useAnimation = () => {
  const ctx = useContext(AnimationContext);
  if (!ctx)
    throw new Error("useAnimation must be used within AnimationProvider");
  return ctx;
};

export const AnimationProvider = ({ children }: { children: ReactNode }) => {
  const controllerRef = useRef<AbortController>(new AbortController());

  const delayInSec = useCallback((sec: number): Promise<void> => {
    const signal = controllerRef.current.signal;
    return new Promise((resolve, reject) => {
      if (signal.aborted) {
        return reject(new DOMException("Aborted", "AbortError"));
      }
      const id = setTimeout(resolve, sec * 1000);
      signal.addEventListener(
        "abort",
        () => {
          clearTimeout(id);
          reject(new DOMException("Aborted", "AbortError"));
        },
        { once: true }
      );
    });
  }, []);

  useEffect(() => {
    const controller = controllerRef.current;
    return () => controller.abort();
  }, []);

  const restart = useCallback(() => {
    controllerRef.current.abort();
    controllerRef.current = new AbortController();
  }, []);

  return (
    <AnimationContext.Provider value={{ delayInSec, restart }}>
      {children}
    </AnimationContext.Provider>
  );
};
