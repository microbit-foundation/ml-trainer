import { forwardRef, useImperativeHandle, useMemo, useState } from "react";
import { Box, Flex } from "@chakra-ui/react";
import { useGraphColors } from "../../hooks/use-graph-colors";
import { useSettings } from "../../store";
import { delayInSec } from "../../utils/delay";

const tileWidth = 177;
const height = 28;
const viewBox = "0 0 177 28";

// ── Smooth mode: gentle rolling waves ────────────────────
const smoothWavePaths = {
  x: "M0 14.5C11.89 11.03 22.68 12.05 34.14 14.57C45.6 17.09 48.88 17.94 60.59 14.64C72.31 11.34 84.18 10.93 96.18 14.56C108.18 18.19 114.39 17.14 125.44 14.5C136.49 11.85 148.92 10.83 167.26 14.5C171 15.19 174 15.19 177 14.5",
  y: "M0 7.5C11.89 4.03 22.68 5.05 34.14 7.57C45.6 10.09 48.88 10.94 60.59 7.64C72.31 4.34 84.18 3.93 96.18 7.56C108.18 11.19 114.39 10.14 125.44 7.5C136.49 4.85 148.92 3.83 167.26 7.5C171 8.19 174 8.19 177 7.5",
  z: "M0 21.5C11.89 18.03 22.68 19.05 34.14 21.57C45.6 24.09 48.88 24.94 60.59 21.64C72.31 18.34 84.18 17.93 96.18 21.56C108.18 25.19 114.39 24.14 125.44 21.5C136.49 18.85 148.92 17.83 167.26 21.5C171 22.19 174 22.19 177 21.5",
};

// ── Wavy mode: big waves ───────────────────────────────
const wavyWavePaths = {
  x: "M0 13.5C5.5 30.5 10.5 25.5 15.81 13.13C21.12 0.76 22.64 -3.44 28.07 12.78C33.5 29 39 31 44.56 13.17C50.12 -4.66 53 0.5 58.12 13.5C63.24 26.5 69 31.5 77.5 13.5C86 -4.5 88.5 0 93.5 13.5C98.5 27 104.5 28 111.5 13.5C118.5 -1 120.26 1 127.5 13.5C134.74 26 141 28.22 147.5 13.5C154 -1.22 155 -4.5 163.5 13.5C169 25.5 173 21 177 13.5",
  y: "M0 13.5C5.5 -2.5 10.5 2.5 15.81 13.5C21.12 24.5 22.64 31.44 28.07 15.22C33.5 -1 39 -3 44.56 13.5C50.12 30 53 27.5 58.12 14.5C63.24 1.5 69 -3.5 77.5 13.5C86 30.5 88.5 28 93.5 14.5C98.5 1 99.5 0 106.5 14.5C113.5 29 115.26 27 122.5 14.5C129.74 2 136 -0.22 142.5 13.5C149 27.22 150 32.5 158.5 14.5C165 -0.5 172 5 177 13.5",
  z: "M0 14.5C3.52 8.26 8.54 10.09 13.86 14.63C19.19 19.16 20.71 20.7 26.16 14.76C31.6 8.81 37.11 8.08 42.69 14.61C48.26 21.15 51.15 19.26 56.29 14.49C61.42 9.73 67.19 7.9 75.72 14.49C84.24 21.09 86.75 19.44 91.76 14.49C96.77 9.55 102.79 9.18 109.81 14.49C116.83 19.81 118.59 19.07 125.85 14.49C133.11 9.91 139.39 9.1 145.9 14.49C152.42 19.89 153.42 21.09 161.95 14.49C168.5 9.2 173.5 11 177 14.5",
};

// ── Chaotic mode: irregular spiky waves ──────────────────
const chaoticWavePaths = {
  x: "M0 16.375C5.52 24.12 10.54 21.88 15.86 16.34C21.19 10.8 22.71 8.92 28.16 16.19C33.6 23.45 39.11 24.35 44.69 16.36C50.26 8.38 53.15 10.69 58.29 16.51C63.42 22.33 69.19 24.57 77.72 16.51C86.24 8.45 88.75 10.46 93.76 16.51C98.77 22.56 104.79 23 111.81 16.51C118.83 10.02 120.59 10.91 127.85 16.51C135.11 22.11 141.39 23.1 147.9 16.51C154.42 9.92 155.42 8.45 163.95 16.51C170 22.5 174 19.5 177 16.375",
  y: "M0 14.225C1.21 10.68 4.12 11.71 7.21 14.24C10.3 16.77 11.19 17.63 14.35 14.31C17.51 10.99 18.47 -9.34 23.95 14.23C29.42 37.8 30.49 17.68 31.84 14.16C33.19 10.65 35.08 1.08 40.11 14.16C45.14 27.24 47.25 16.99 50.16 14.22C53.07 11.46 55.19 11.14 57.7 14.16C60.22 17.18 68.39 23.26 72.24 14.16C76.08 5.06 77.82 -4.94 83.88 14.16C89.95 33.27 88.5 26.24 93.2 14.16C97.89 2.09 99.18 5.12 102.33 14.67C105.47 24.23 109.24 24.73 112.38 14.67C115.52 4.61 118.67 11.65 122.44 16.18C126.21 20.71 126.84 20.71 130.61 16.18C134.38 11.65 135.64 -8.98 143.18 14.22C150.72 37.43 153.23 17.19 154.49 12.66C155.75 8.13 159.93 4.11 162.66 14.16C165.39 24.22 166.58 25.73 171.46 14.67C174.5 7 177 14.225 177 14.225",
  z: "M0 14.775C1.24 18.32 4.19 17.29 7.31 14.76C10.44 12.23 11.33 11.37 14.53 14.69C17.73 18.01 18.7 38.34 24.24 14.77C29.77 -8.8 30.85 11.32 32.22 14.84C33.58 18.35 35.49 27.92 40.57 14.84C45.66 1.76 47.8 12.01 50.74 14.78C53.68 17.54 55.82 17.86 58.36 14.84C60.91 11.82 69.17 5.74 73.06 14.84C76.95 23.94 78.7 33.94 84.83 14.84C90.96 -4.27 89.5 2.76 94.25 14.84C98.1 25.5 100.3 23.88 103.48 14.33C106.66 4.77 110.47 4.27 113.65 14.33C116.82 24.39 120 17.35 123.81 12.82C127.63 8.29 128.26 8.3 132.07 12.82C135.89 17.35 137.16 37.98 144.78 14.78C152.41 -8.43 154.95 11.82 156.22 16.34C157.49 20.87 161.72 24.89 164.48 14.84C167.24 4.78 168.44 3.27 173.38 14.33C175.5 19.5 177 14.775 177 14.775",
};

// ── Motion config lookup ───────────────────────────────────────────────────
const motionPaths = {
  smooth: smoothWavePaths,
  wavy: wavyWavePaths,
  chaotic: chaoticWavePaths,
} as const;

const visibleWindowWidth = 100;
const animationDuration = 3;
const fadeOutDuration = 0.4;

type MotionType = keyof typeof motionPaths;

type DisplayState =
  // Visible.
  | "visible"
  // Hidden but still taking up space.
  | "hidden"
  // Not displayed at all and not taking up space.
  | "none";
export interface AnimatedGraphLinesRef {
  setDisplayState(state: DisplayState): void;
  play(motion: MotionType, secs?: number): Promise<void>;
  fadeOut(durationInSecs?: number): Promise<void>;
  reset(): void;
}

const AnimatedGraphLines = forwardRef<AnimatedGraphLinesRef>(
  function AnimatedGraphLines(_, ref) {
    const [{ graphColorScheme }] = useSettings();
    const [displayState, setDisplayState] = useState<DisplayState>("none");
    const [fadeDuration, setFadeDuration] = useState<number>(fadeOutDuration);
    const colors = useGraphColors(graphColorScheme);
    const [motion, setMotion] = useState<MotionType>("wavy");

    const waves = useMemo(
      () => [
        { color: colors.x, pathKey: "x" as const },
        { color: colors.y, pathKey: "y" as const },
        { color: colors.z, pathKey: "z" as const },
      ],
      [colors.x, colors.y, colors.z]
    );

    useImperativeHandle(
      ref,
      () => ({
        setDisplayState,
        async play(motionType, durationInSecs = 3) {
          setDisplayState("visible");
          setFadeDuration(0);
          if (motionType) {
            setMotion(motionType);
          }
          await delayInSec(durationInSecs);
        },
        async fadeOut(durationInSecs = fadeOutDuration) {
          setFadeDuration(durationInSecs);
          await delayInSec(durationInSecs);
          setDisplayState("hidden");
        },
        reset() {
          setFadeDuration(0);
          setDisplayState("none");
        },
      }),
      []
    );

    const paths = motionPaths[motion];

    return (
      <Flex
        display={displayState === "none" ? "none" : "flex"}
        opacity={displayState === "hidden" ? 0 : 1}
        transition={`opacity ${fadeDuration}s ease-out`}
        direction="column"
        align="center"
        justify="center"
        position="relative"
      >
        <Box position="relative" zIndex={2}>
          <style>{`
            @keyframes waveScroll-${motion} {
              from { transform: translateX(${
                -tileWidth + visibleWindowWidth
              }px); }
              to   { transform: translateX(0); }
            }
          `}</style>

          <Box
            width={`${visibleWindowWidth}px`}
            height={`${height}px`}
            overflow="hidden"
          >
            <Flex
              animation={`waveScroll-${motion} ${animationDuration}s linear infinite`}
            >
              {[0, 1].map((copy) => (
                <Box
                  as="svg"
                  key={copy}
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox={viewBox}
                  width={`${tileWidth}px`}
                  height={`${height}px`}
                  display="block"
                  flexShrink={0}
                  preserveAspectRatio="none"
                >
                  {waves.map((wave) => (
                    <path
                      key={wave.pathKey}
                      d={paths[wave.pathKey]}
                      fill="none"
                      stroke={wave.color}
                      strokeOpacity={1}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                    />
                  ))}
                </Box>
              ))}
            </Flex>
          </Box>
        </Box>
      </Flex>
    );
  }
);

export default AnimatedGraphLines;
