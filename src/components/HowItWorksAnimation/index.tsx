/**
 * (c) 2026, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { HStack, VStack } from "@chakra-ui/react";
import { useCallback, useEffect, useRef } from "react";
import { delayInSec } from "../../utils/delay";
import AnimatedGraphLines, {
  AnimatedGraphLinesRef,
} from "./AnimatedGraphLines";
import { dataCollectionDurationInSec } from "./DataSamplesCollection";
import HandHoldingMicrobit, {
  HandHoldingMicrobitRef,
} from "./HandHoldingMicrobit";
import Laptop, { LaptopRef } from "./Laptop";
import MicrobitOnWrist, { MicrobitOnWristRef } from "./MicrobitOnWrist";
import Signal, { SignalRef } from "./Signal";
import StepFlow, { StepFlowRef } from "./StepFlow";
import { ledPatternOptions } from "./utils";
import { testModeldurationInSec } from "./TestModelScreen";

const HowItWorksAnimation = () => {
  const stepFlowRef = useRef<StepFlowRef>(null);
  const signalRef = useRef<SignalRef>(null);
  const handHoldingMicrobitRef = useRef<HandHoldingMicrobitRef>(null);
  const microbitOnWristRef = useRef<MicrobitOnWristRef>(null);
  const laptopRef = useRef<LaptopRef>(null);
  const animatedGraphLinesRef = useRef<AnimatedGraphLinesRef>(null);

  const runConnect = useCallback(async () => {
    handHoldingMicrobitRef.current?.reset();
    animatedGraphLinesRef.current?.reset();
    handHoldingMicrobitRef.current?.show();
    stepFlowRef.current?.setStep(0, "active");
    await signalRef.current?.showConnecting();
    await Promise.all([
      signalRef.current?.showConnected(),
      handHoldingMicrobitRef.current?.displaySmileLed(),
      laptopRef.current?.setDisplay("tick"),
    ]);
    stepFlowRef.current?.setStep(0, "completed");
    await delayInSec(0.5);
  }, []);

  const runCollectData = useCallback(async () => {
    // Setup.
    laptopRef.current?.setDisplay(null);
    handHoldingMicrobitRef.current?.reset();
    microbitOnWristRef.current?.show({
      orientation: "horizontal",
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
    // Setup
    laptopRef.current?.setDisplay("test-model");
    handHoldingMicrobitRef.current?.reset();
    microbitOnWristRef.current?.show({
      orientation: "horizontal",
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
    laptopRef.current?.setDisplay(null);
  }, []);

  useEffect(() => {
    const run = async () => {
      await runConnect();
      await runCollectData();
      await runTraining();
      await runTestModel();
    };

    void run();
  }, [runConnect, runCollectData, runTestModel, runTraining]);

  return (
    <VStack gap={7}>
      <HStack justifyContent="center" width="100%" gap={5}>
        <StepFlow ref={stepFlowRef} />
      </HStack>
      <Signal ref={signalRef} />
      <HStack alignItems="center" gap={5}>
        <HandHoldingMicrobit
          width={200}
          height={180}
          ref={handHoldingMicrobitRef}
        />
        <MicrobitOnWrist width={200} height={180} ref={microbitOnWristRef} />
        <AnimatedGraphLines ref={animatedGraphLinesRef} />
        <Laptop width={230} height="auto" ref={laptopRef} />
      </HStack>
    </VStack>
  );
};

export default HowItWorksAnimation;
