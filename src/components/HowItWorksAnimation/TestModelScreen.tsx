import { Grid, GridItem, useToken } from "@chakra-ui/react";
import {
  forwardRef,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import AnimatedGauge, {
  AnimatedGaugeRef,
  buildIconColorKeyframes,
  totalDuration,
} from "./AnimatedGauge";
import CrossLedIcon from "./CrossLedIcon";
import HeartLedIcon from "./HeartLedIcon";

export interface TestModelScreenRef {
  playAction1(): Promise<void>;
  playAction2(): Promise<void>;
}

export const testModeldurationInSec = totalDuration;
const iconSize = { base: "1em", sm: "1.25em", md: "1.75em" };
const TestModelScreen = forwardRef<TestModelScreenRef>(function TestModelScreen(
  _,
  ref
) {
  const [empty, filled, filledDark] = useToken("colors", [
    "gray.200",
    "gray.600",
    "brand2.500",
  ]);
  const colorChange = useMemo(
    () => buildIconColorKeyframes(filled, filledDark),
    [filled, filledDark]
  );

  const [playing, setPlaying] = useState<"heart" | "cross" | false>(false);
  const gaugeRef1 = useRef<AnimatedGaugeRef>(null);
  const gaugeRef2 = useRef<AnimatedGaugeRef>(null);

  useImperativeHandle(
    ref,
    () => ({
      async playAction1() {
        setPlaying("heart");
        await gaugeRef1.current?.play();
      },
      async playAction2() {
        setPlaying("cross");
        await gaugeRef2.current?.play();
      },
      reset() {
        setPlaying(false);
      },
    }),
    []
  );

  return (
    <Grid
      templateColumns={{
        base: `${iconSize.base} 1fr`,
        sm: `${iconSize.sm} 1fr`,
        md: `${iconSize.md} 1fr`,
      }}
      columnGap={2}
      rowGap={{ sm: 1, md: 3 }}
      alignItems="center"
    >
      <GridItem w="auto">
        <HeartLedIcon
          width={iconSize}
          height={iconSize}
          color="gray.600"
          animation={
            playing === "heart" ? `${colorChange} ${totalDuration}s` : undefined
          }
        />
      </GridItem>
      <GridItem>
        <AnimatedGauge
          empty={empty}
          filled={filled}
          filledDark={filledDark}
          ref={gaugeRef1}
        />
      </GridItem>
      <GridItem>
        <CrossLedIcon
          width={iconSize}
          height={iconSize}
          color="gray.600"
          animation={
            playing === "cross" ? `${colorChange} ${totalDuration}s` : undefined
          }
        />
      </GridItem>
      <GridItem>
        <AnimatedGauge
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
