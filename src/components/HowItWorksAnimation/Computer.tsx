/**
 * (c) 2026, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { Box, Heading, Icon, IconProps, Stack, VStack } from "@chakra-ui/react";
import { forwardRef, useImperativeHandle, useRef, useState } from "react";
import { FormattedMessage } from "react-intl";
import ProgressBar, { ProgressBarRef } from "./ProgressBar";
import DataSamplesCollection, {
  DataSamplesCollectionRef,
} from "./DataSamplesCollection";
import TestModelScreen, { TestModelScreenRef } from "./TestModelScreen";
import Tick from "./Tick";
import { animations } from "../../utils/animations";
import CodeBlock, { CodeBlockRef } from "./CodeBlocks";
import { useAnimation } from "../AnimationProvider";

interface ComputerProps extends IconProps {}
type DisplayType =
  | "none"
  | "tick"
  | "data-collection"
  | "training"
  | "test-model"
  | "code";
export interface ComputerRef {
  setDisplay(type: DisplayType): void;
  dataSamples: DataSamplesCollectionRef | null;
  testModel: TestModelScreenRef | null;
  codeBlock: CodeBlockRef | null;
  playTraining(durationInSecs?: number): Promise<void>;
  playCode(): Promise<void>;
  setVisible(visible: boolean): void;
  reset(): void;
}

const Computer = forwardRef<ComputerRef, ComputerProps>(function Computer(
  { ...props }: ComputerProps,
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
        dataSamples: dataSamplesRef.current,
        testModel: testModelRef.current,
        codeBlock: codeBlockRef.current,
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
      <Icon viewBox="0 0 195.46 133.33" {...props}>
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
      </Icon>
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
          display={display === "tick" ? "block" : "none"}
          size="30%"
          animation={withPlayState(
            `${animations.fadeIn} 0.3s ease-in-out forwards`
          )}
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
          animation={withPlayState(
            `${animations.fadeIn} 0.3s ease-in-out forwards`
          )}
        />
      </Stack>
    </Box>
  );
});

export default Computer;
