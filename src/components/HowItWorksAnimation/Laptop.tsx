import { Box, Icon, IconProps, Stack, Text, VStack } from "@chakra-ui/react";
import { forwardRef, useImperativeHandle, useRef, useState } from "react";
import { FormattedMessage } from "react-intl";
import AnimatedProgressBar, {
  AnimatedProgressBarRef,
} from "./AnimatedProgressBar";
import DataSamplesCollection, {
  DataSamplesCollectionRef,
} from "./DataSamplesCollection";
import TestModelScreen, { TestModelScreenRef } from "./TestModelScreen";
import Tick from "./Tick";
import { animation } from "./utils";
import CodeBlock, { CodeBlockRef } from "./CodeBlocks";

interface LaptopProps extends IconProps {}
type DisplayType =
  | "none"
  | "tick"
  | "data-collection"
  | "training"
  | "test-model"
  | "code";
export interface LaptopRef {
  setDisplay(type: DisplayType): void;
  playDataCollectionTopSamples(): Promise<void>;
  playDataCollectionBottomSamples(): Promise<void>;
  playTraining(durationInSecs?: number): Promise<void>;
  playTestModelAction1(): Promise<void>;
  playTestModelAction2(): Promise<void>;
  playCode(): Promise<void>;
  hide(): void;
  reset(): void;
}

const Laptop = forwardRef<LaptopRef, LaptopProps>(function Laptop(
  { ...props }: LaptopProps,
  ref
) {
  const testModelRef = useRef<TestModelScreenRef>(null);
  const codeRef = useRef<CodeBlockRef>(null);
  const dataSamplesRef = useRef<DataSamplesCollectionRef>(null);
  const progressBarRef = useRef<AnimatedProgressBarRef>(null);
  const [visible, setVisible] = useState<boolean>(true);
  const [display, setDisplay] = useState<DisplayType>("none");
  useImperativeHandle(
    ref,
    () => {
      return {
        setDisplay,
        async playDataCollectionTopSamples() {
          setDisplay("data-collection");
          await dataSamplesRef.current?.playTopSamples();
        },
        async playDataCollectionBottomSamples() {
          setDisplay("data-collection");
          await dataSamplesRef.current?.playBottomSamples();
        },
        async playTraining(secs = 2) {
          setDisplay("training");
          await progressBarRef.current?.play(secs);
        },
        async playTestModelAction1() {
          setDisplay("test-model");
          await testModelRef.current?.playAction1();
        },
        async playTestModelAction2() {
          setDisplay("test-model");
          await testModelRef.current?.playAction2();
        },
        async playCode() {
          setDisplay("code");
          await codeRef.current?.play();
        },
        hide() {
          setVisible(false);
        },
        reset() {
          setVisible(true);
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
        {display === "tick" && (
          <Tick
            size="30%"
            animation={`${animation.fadeIn} 0.3s ease-in-out forwards`}
          />
        )}
        {/* Data collection display */}
        <DataSamplesCollection
          color="gray.600"
          ref={dataSamplesRef}
          display={display === "data-collection" ? "block" : "none"}
        />
        {/* Training display */}
        <VStack display={display === "training" ? "flex" : "none"}>
          <Text fontWeight="bold" fontSize={{ base: "sm", sm: "sm", md: "md" }}>
            <FormattedMessage id="animation-training" />
          </Text>
          <AnimatedProgressBar ref={progressBarRef} />
        </VStack>
        {/* Test model display */}
        {display === "test-model" && <TestModelScreen ref={testModelRef} />}
        {/* Code display */}
        {display === "code" && (
          <CodeBlock
            ref={codeRef}
            animation={`${animation.fadeIn} 0.3s ease-in-out forwards`}
          />
        )}
      </Stack>
    </Box>
  );
});

export default Laptop;
