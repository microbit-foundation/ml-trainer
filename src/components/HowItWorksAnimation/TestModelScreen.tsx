/**
 * (c) 2026, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import {
  CSSProperties,
  forwardRef,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { Grid, GridItem, token } from "../../shared-ui";
import Gauge, { GaugeRef, totalDuration } from "./Gauge";
import CrossLedIcon from "./CrossLedIcon";
import HeartLedIcon from "./HeartLedIcon";
import { useAnimation } from "../AnimationProvider";

export interface TestModelScreenRef {
  playAction1(): Promise<void>;
  playAction2(): Promise<void>;
  show(): void;
  reset(): void;
}

export const testModeldurationInSec = totalDuration;
const TestModelScreen = forwardRef<TestModelScreenRef>(function TestModelScreen(
  _,
  ref
) {
  const empty = token("colors.gray.200");
  const filled = token("colors.gray.600");
  const filledDark = token("colors.brand2.500");
  // The preset's gaugeIconColor keyframe reads the colours from these vars.
  const iconColorAnimation: CSSProperties = {
    "--gauge-icon-from": filled,
    "--gauge-icon-to": filledDark,
  } as CSSProperties;

  const [playing, setPlaying] = useState<"heart" | "cross" | false>(false);
  const [visible, setVisible] = useState<boolean>(false);
  const gaugeRef1 = useRef<GaugeRef>(null);
  const gaugeRef2 = useRef<GaugeRef>(null);
  const { withPlayState } = useAnimation();

  useImperativeHandle(
    ref,
    () => ({
      show() {
        setVisible(true);
      },
      async playAction1() {
        setPlaying("heart");
        await gaugeRef1.current?.play();
      },
      async playAction2() {
        setPlaying("cross");
        await gaugeRef2.current?.play();
      },
      reset() {
        setVisible(false);
        setPlaying(false);
        gaugeRef1.current?.reset();
        gaugeRef2.current?.reset();
      },
    }),
    []
  );

  return (
    <Grid
      gridTemplateColumns={{
        base: "1em 1fr",
        sm: "1.25em 1fr",
        md: "1.5em 1fr",
      }}
      columnGap={2}
      rowGap={{ sm: 1, md: 3 }}
      alignItems="center"
      display={visible ? "grid" : "none"}
    >
      <GridItem w="auto">
        <HeartLedIcon
          css={{
            width: { base: "1em", sm: "1.25em", md: "1.5em" },
            height: { base: "1em", sm: "1.25em", md: "1.5em" },
            color: "gray.600",
          }}
          style={{
            ...iconColorAnimation,
            animation:
              playing === "heart"
                ? withPlayState(`gaugeIconColor ${totalDuration}s`)
                : undefined,
          }}
        />
      </GridItem>
      <GridItem>
        <Gauge
          empty={empty}
          filled={filled}
          filledDark={filledDark}
          ref={gaugeRef1}
        />
      </GridItem>
      <GridItem>
        <CrossLedIcon
          css={{
            width: { base: "1em", sm: "1.25em", md: "1.5em" },
            height: { base: "1em", sm: "1.25em", md: "1.5em" },
            color: "gray.600",
          }}
          style={{
            ...iconColorAnimation,
            animation:
              playing === "cross"
                ? withPlayState(`gaugeIconColor ${totalDuration}s`)
                : undefined,
          }}
        />
      </GridItem>
      <GridItem>
        <Gauge
          ref={gaugeRef2}
          empty={empty}
          filled={filled}
          filledDark={filledDark}
        />
      </GridItem>
    </Grid>
  );
});

export default TestModelScreen;
