/**
 * (c) 2026, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { Box } from "@chakra-ui/react";
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
interface AnimationContextValue {
  delayInSec: (sec: number) => Promise<void>;
  restartAbortController: () => void;
  pause: () => void;
  resume: () => void;
  isPaused: boolean;
  withPlayState: (animationCss: string) => string;
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
  const [isPaused, setIsPaused] = useState(false);

  const resumeRef = useRef<(() => void) | null>(null);
  const pausePromiseRef = useRef<Promise<void>>(Promise.resolve());
  const pauseSubscribersRef = useRef<Set<() => void>>(new Set());

  const pause = useCallback(() => {
    setIsPaused(true);
    pausePromiseRef.current = new Promise((resolve) => {
      resumeRef.current = resolve;
    });
    // Interrupt all currently-running delays
    pauseSubscribersRef.current.forEach((fn) => fn());
  }, []);

  const resume = useCallback(() => {
    setIsPaused(false);
    resumeRef.current?.();
    resumeRef.current = null;
  }, []);

  const delayInSec = useCallback((sec: number): Promise<void> => {
    const signal = controllerRef.current.signal;

    return new Promise((resolve, reject) => {
      if (signal.aborted)
        return reject(new DOMException("Aborted", "AbortError"));

      let timeoutId: ReturnType<typeof setTimeout>;
      let remainingMs = sec * 1000;
      let startedAt: number;

      const cleanup = () => {
        clearTimeout(timeoutId);
        signal.removeEventListener("abort", onAbort);
        pauseSubscribersRef.current.delete(onPause);
      };

      const onAbort = () => {
        cleanup();
        reject(new DOMException("Aborted", "AbortError"));
      };

      const start = () => {
        startedAt = performance.now();
        pauseSubscribersRef.current.add(onPause);
        timeoutId = setTimeout(() => {
          cleanup();
          resolve();
        }, remainingMs);
      };

      const onPause = () => {
        clearTimeout(timeoutId);
        pauseSubscribersRef.current.delete(onPause);
        remainingMs -= performance.now() - startedAt;
        // Wait for resume, then restart with remaining time
        void pausePromiseRef.current.then(() => {
          if (signal.aborted) return onAbort();
          start();
        });
      };

      signal.addEventListener("abort", onAbort, { once: true });

      // If already paused when called, wait before starting
      void pausePromiseRef.current.then(() => {
        if (signal.aborted) return onAbort();
        start();
      });
    });
  }, []);

  useEffect(() => {
    const controller = controllerRef.current;
    return () => controller.abort();
  }, []);

  const restartAbortController = useCallback(() => {
    controllerRef.current.abort();
    controllerRef.current = new AbortController();
  }, []);

  const withPlayState = useCallback(
    (s: string) => `${s} ${isPaused ? "paused" : "running"}`,
    [isPaused]
  );

  return (
    <AnimationContext.Provider
      value={{
        delayInSec,
        pause,
        resume,
        isPaused,
        restartAbortController,
        withPlayState,
      }}
    >
      <Box>{children}</Box>
    </AnimationContext.Provider>
  );
};
