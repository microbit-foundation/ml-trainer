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
import { FormattedMessage } from "react-intl";
import {
  Box,
  Heading,
  Stack,
  Svg,
  SystemStyleObject,
  VStack,
} from "@microbit/ui";
import ProgressBar, { ProgressBarRef } from "./ProgressBar";
import DataSamplesCollection, {
  DataSamplesCollectionRef,
} from "./DataSamplesCollection";
import TestModelScreen, { TestModelScreenRef } from "./TestModelScreen";
import Tick from "./Tick";
import CodeBlock, { CodeBlockRef } from "./CodeBlocks";
import { useAnimation } from "../AnimationProvider";

interface ComputerProps {
  isTablet: boolean;
  /** Per-instance style overrides for the computer svg. */
  css?: SystemStyleObject;
  style?: CSSProperties;
}
type DisplayType =
  | "none"
  | "tick"
  | "data-collection"
  | "training"
  | "test-model"
  | "code";
export interface ComputerRef {
  setDisplay(type: DisplayType): void;
  getDataSamples(): DataSamplesCollectionRef | null;
  getTestModel(): TestModelScreenRef | null;
  getCodeBlock(): CodeBlockRef | null;
  playTraining(durationInSecs?: number): Promise<void>;
  playCode(): Promise<void>;
  setVisible(visible: boolean): void;
  reset(): void;
}

const Computer = forwardRef<ComputerRef, ComputerProps>(function Computer(
  { isTablet, css: cssProp, style }: ComputerProps,
  ref
) {
  const { withPlayState } = useAnimation();
  const testModelRef = useRef<TestModelScreenRef>(null);
  const codeBlockRef = useRef<CodeBlockRef>(null);
  const dataSamplesRef = useRef<DataSamplesCollectionRef>(null);
  const progressBarRef = useRef<ProgressBarRef>(null);
  const [visible, setVisible] = useState<boolean>(true);
  const [display, setDisplay] = useState<DisplayType>("none");
  useImperativeHandle(
    ref,
    () => {
      return {
        setDisplay,
        getDataSamples() {
          return dataSamplesRef.current;
        },
        getTestModel() {
          return testModelRef.current;
        },
        getCodeBlock() {
          return codeBlockRef.current;
        },
        async playTraining(secs = 2) {
          setDisplay("training");
          await progressBarRef.current?.play(secs);
        },
        async playCode() {
          setDisplay("code");
          await codeBlockRef.current?.play();
        },
        setVisible,
        reset() {
          setVisible(false);
          dataSamplesRef.current?.reset();
          testModelRef.current?.reset();
          codeBlockRef.current?.reset();
          setDisplay("none");
        },
      };
    },
    []
  );
  return (
    <Box
      position="relative"
      opacity={visible ? 1 : 0}
      transition="opacity 0.3s ease"
    >
      {isTablet ? (
        <Svg
          viewBox="0 0 195.46 133.33"
          css={{ ...cssProp, mt: "-10px" }}
          style={style}
        >
          <rect
            fill="none"
            stroke="#1e1e1c"
            strokeMiterlimit={10}
            strokeWidth="4px"
            width="170"
            height="120"
            x={10}
            y={3}
            rx="15"
          />
          <circle cx="97" cy="15" r="3" />
        </Svg>
      ) : (
        <Svg viewBox="0 0 195.46 133.33" css={cssProp} style={style}>
          <path
            fill="none"
            stroke="#1e1e1c"
            strokeMiterlimit={10}
            strokeWidth="4px"
            d="M22.78,112.02V19.03c0-7.64,6.2-13.84,13.84-13.84h122.44c7.64,0,13.84,6.2,13.84,13.84v93.1"
          />
          <path
            fill="none"
            stroke="#1e1e1c"
            strokeMiterlimit={10}
            strokeWidth="4px"
            d="M187.33,111.97H8.14c-1.36,0-2.49,1.13-2.49,2.48,0,7.23,5.76,13.11,12.99,13.11h158.18c7.23,0,12.99-5.88,12.99-13.11,0-.68-.23-1.35-.68-1.81-.56-.34-1.13-.56-1.81-.68"
          />
        </Svg>
      )}
      <Stack
        position="absolute"
        width={{ base: "80%", sm: "60%", md: "40%" }}
        height="80%"
        left="10%"
        top="5%"
        alignItems="center"
        justifyContent="center"
      >
        {/* Tick display */}
        <Tick
          css={{
            display: display === "tick" ? "block" : "none",
            width: "30%",
            height: "30%",
          }}
          style={{
            animation: withPlayState(`fadeIn 0.3s ease-in-out forwards`),
          }}
        />
        {/* Data collection display */}
        <DataSamplesCollection ref={dataSamplesRef} />
        {/* Training display */}
        <VStack display={display === "training" ? "flex" : "none"}>
          <Heading
            variant="marketing"
            fontWeight="bold"
            fontSize={{ base: "sm", sm: "sm", md: "md" }}
          >
            <FormattedMessage id="animation-training" />
          </Heading>
          <ProgressBar ref={progressBarRef} />
        </VStack>
        <TestModelScreen ref={testModelRef} />
        {/* Code display */}
        <CodeBlock
          ref={codeBlockRef}
          style={{
            animation: withPlayState(`fadeIn 0.3s ease-in-out forwards`),
          }}
        />
      </Stack>
    </Box>
  );
});

export default Computer;
