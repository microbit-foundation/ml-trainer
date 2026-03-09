/**
 * (c) 2026, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { HStack, VStack } from "@chakra-ui/react";
import { useCallback, useEffect, useRef, useState } from "react";
import AnimatedArrow, { AnimatedArrowRef } from "./AnimatedArrow";
import AnimatedGraphLines, {
  AnimatedGraphLinesRef,
} from "./AnimatedGraphLines";
import { dataCollectionDurationInSec } from "./DataSamplesCollection";
import HandHoldingMicrobit, {
  HandHoldingMicrobitRef,
} from "./HandHoldingMicrobit";
import Laptop, { LaptopRef } from "./Laptop";
import Layout, { LayoutRef } from "./Layout";
import MicrobitOnWrist, { MicrobitOnWristRef } from "./MicrobitOnWrist";
import Signal, { SignalRef } from "./Signal";
import StepFlow, { StepFlowRef } from "./StepFlow";
import { testModeldurationInSec } from "./TestModelScreen";
import { ledPatternOptions } from "./utils";
import { useAnimation } from "../AnimationProvider";

const fadeInOutDuration = 2; //s

const HowItWorksAnimation = () => {
  const { delayInSec, restart } = useAnimation();
  const stepFlowRef = useRef<StepFlowRef>(null);
  const signalRef = useRef<SignalRef>(null);
  const codeArrowRef = useRef<AnimatedArrowRef>(null);
  const handHoldingMicrobitRef = useRef<HandHoldingMicrobitRef>(null);
  const microbitOnWristRef = useRef<MicrobitOnWristRef>(null);
  const laptopRef = useRef<LaptopRef>(null);
  const animatedGraphLinesRef = useRef<AnimatedGraphLinesRef>(null);
  const layoutRef = useRef<LayoutRef>(null);
  const [visible, setVisible] = useState<boolean>(true);

  const reset = useCallback(() => {
    handHoldingMicrobitRef.current?.reset();
    animatedGraphLinesRef.current?.reset();
    microbitOnWristRef.current?.reset();
    stepFlowRef.current?.reset();
    laptopRef.current?.reset();
    signalRef.current?.reset();
    layoutRef.current?.reset();
  }, []);

  const runConnect = useCallback(async () => {
    // Setup.
    stepFlowRef.current?.setStep(0, "active");
    animatedGraphLinesRef.current?.setDisplayState("hidden");
    handHoldingMicrobitRef.current?.show();

    // Connect.
    await signalRef.current?.showConnecting();
    await Promise.all([
      signalRef.current?.showConnected(),
      handHoldingMicrobitRef.current?.displaySmileLed(),
      laptopRef.current?.setDisplay("tick"),
    ]);
    stepFlowRef.current?.setStep(0, "completed");
    await delayInSec(0.5);
  }, [delayInSec]);

  const runCollectData = useCallback(async () => {
    // Setup.
    laptopRef.current?.setDisplay("none");
    animatedGraphLinesRef.current?.setDisplayState("hidden");
    handHoldingMicrobitRef.current?.reset();
    microbitOnWristRef.current?.show({
      ledPattern: ledPatternOptions.smile,
    });
    stepFlowRef.current?.setStep(1, "active");
    await animatedGraphLinesRef.current?.play("smooth", 1);

    // Collect data for wave movement.
    microbitOnWristRef.current?.setMove("wave");
    await Promise.all([
      animatedGraphLinesRef.current?.play("wavy", dataCollectionDurationInSec),
      laptopRef.current?.playDataCollectionTopSamples(),
    ]);

    // Collect data for up down movement.
    microbitOnWristRef.current?.setMove("up-down");
    await Promise.all([
      animatedGraphLinesRef.current?.play(
        "chaotic",
        dataCollectionDurationInSec
      ),
      laptopRef.current?.playDataCollectionBottomSamples(),
    ]);

    stepFlowRef.current?.setStep(1, "completed");
  }, []);

  const runTraining = useCallback(async () => {
    microbitOnWristRef.current?.setMove("still");
    await Promise.all([
      animatedGraphLinesRef.current?.play("smooth"),
      laptopRef.current?.playTraining(),
    ]);
  }, []);

  const runTestModel = useCallback(async () => {
    // Reset.
    handHoldingMicrobitRef.current?.reset();

    // Setup
    laptopRef.current?.setDisplay("test-model");
    microbitOnWristRef.current?.show({
      ledPattern: ledPatternOptions.smile,
    });
    stepFlowRef.current?.setStep(2, "active");
    microbitOnWristRef.current?.setMove("still");
    await animatedGraphLinesRef.current?.play("smooth", 1);

    // Test model for wave movement.
    microbitOnWristRef.current?.setMove("wave");
    await Promise.all([
      animatedGraphLinesRef.current?.play("wavy", testModeldurationInSec),
      laptopRef.current?.playTestModelAction1(),
    ]);

    // Pause on still.
    microbitOnWristRef.current?.setMove("still");
    await animatedGraphLinesRef.current?.play("smooth", 1);

    // Test model for up down movement.
    microbitOnWristRef.current?.setMove("up-down");
    await Promise.all([
      animatedGraphLinesRef.current?.play("chaotic", testModeldurationInSec),
      laptopRef.current?.playTestModelAction2(),
    ]);

    // Show iterative flow.
    microbitOnWristRef.current?.setMove("still");
    await animatedGraphLinesRef.current?.fadeOut();

    stepFlowRef.current?.setArrows("active");
    await delayInSec(0.5);
    stepFlowRef.current?.setStep(2, "completed");
    await delayInSec(0.5);

    stepFlowRef.current?.setAllInactive();
    laptopRef.current?.setDisplay("none");
    await delayInSec(0.5);
  }, [delayInSec]);

  const runCode = useCallback(async () => {
    // Reset.
    animatedGraphLinesRef.current?.reset();
    handHoldingMicrobitRef.current?.reset();

    // Setup.
    codeArrowRef.current?.setDisplayState("hidden");
    laptopRef.current?.setDisplay("code");
    microbitOnWristRef.current?.show({
      ledPattern: ledPatternOptions.smile,
    });
    stepFlowRef.current?.setStep(3, "active");

    // Code.
    await delayInSec(1.3);
    await laptopRef.current?.playCode();
    stepFlowRef.current?.setStep(3, "completed");

    // Download program.
    await codeArrowRef.current?.play();
    microbitOnWristRef.current?.show({ ledPattern: ledPatternOptions.default });
    codeArrowRef.current?.setDisplayState("hidden");
    stepFlowRef.current?.setAllInactive();
    laptopRef.current?.setDisplay("none");
  }, [delayInSec]);

  const runUse = useCallback(async () => {
    // Setup
    microbitOnWristRef.current?.show({ ledPattern: ledPatternOptions.default });
    stepFlowRef.current?.setStep(4, "active");
    await layoutRef.current?.playCenteringLeft();
    signalRef.current?.hide();
    laptopRef.current?.hide();
    codeArrowRef.current?.setDisplayState("none");
    await delayInSec(1);
    microbitOnWristRef.current?.show({
      ledPattern: ledPatternOptions.heart,
      move: "wave",
      backgroundMode: "sparkly-heart",
    });
    stepFlowRef.current?.setStep(4, "completed");
    await delayInSec(3);
    microbitOnWristRef.current?.show({
      ledPattern: ledPatternOptions.cross,
      move: "up-down",
      backgroundMode: "sparkly-cross",
    });
    await delayInSec(3);
  }, [delayInSec]);

  useEffect(() => {
    const run = async () => {
      // eslint-disable-next-line no-constant-condition
      while (true) {
        try {
          setVisible(true);
          await runConnect();
          await runCollectData();
          await runTraining();
          await runTestModel();
          await runCode();
          await runUse();
          setVisible(false);
          await delayInSec(fadeInOutDuration);
          reset();
        } catch (e) {
          if (e instanceof DOMException && e.name === "AbortError") {
            // Abort running animation.
            return;
          }
          throw e;
        }
      }
    };

    restart();
    void run();
  }, [
    runConnect,
    runCollectData,
    runTestModel,
    runTraining,
    runCode,
    runUse,
    reset,
    delayInSec,
    restart,
  ]);

  return (
    <VStack
      gap={7}
      opacity={visible ? 1 : 0}
      transition={`opacity ${fadeInOutDuration}s ease`}
      height={{ base: "auto", md: "20em" }}
    >
      <HStack justifyContent="center" width="100%" gap={5}>
        <StepFlow ref={stepFlowRef} />
      </HStack>
      <Signal ref={signalRef} />
      <Layout
        ref={layoutRef}
        leftItems={
          <>
            <HandHoldingMicrobit
              px="5%"
              width={{ base: "100%", sm: "80%", md: "60%" }}
              height="auto"
              ref={handHoldingMicrobitRef}
            />
            <MicrobitOnWrist ref={microbitOnWristRef} />
          </>
        }
        middleItems={
          <>
            <AnimatedGraphLines ref={animatedGraphLinesRef} />
            <AnimatedArrow ref={codeArrowRef} />
          </>
        }
        rightItems={
          <Laptop
            height="auto"
            ref={laptopRef}
            boxSize={{ base: "100%", sm: "80%", md: "60%" }}
          />
        }
      />
    </VStack>
  );
};

export default HowItWorksAnimation;
