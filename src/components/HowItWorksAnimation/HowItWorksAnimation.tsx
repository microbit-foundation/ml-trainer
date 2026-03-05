/**
 * (c) 2026, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { HStack, VStack } from "@chakra-ui/react";
import { useCallback, useEffect, useRef } from "react";

import Laptop, { LaptopRef } from "./Laptop";
import Signal, { SignalRef } from "./Signal";
import StepFlow, { StepFlowRef } from "./StepFlow";
import HandHoldingMicrobit, {
  HandHoldingMicrobitRef,
} from "./HandHoldingMicrobit";
import MicrobitOnWrist, { MicrobitOnWristRef } from "./MicrobitOnWrist";
import AnimatedGraphLines, {
  AnimatedGraphLinesRef,
} from "./AnimatedGraphLines";
import { ledPatternOptions } from "./utils";
import { dataCollectionDurationInSec } from "./DataSamplesCollection";
import { delayInSec } from "../../utils/delay";

const HowItWorksAnimation = () => {
  const stepFlowRef = useRef<StepFlowRef>(null);
  const signalRef = useRef<SignalRef>(null);
  const handHoldingMicrobitRef = useRef<HandHoldingMicrobitRef>(null);
  const microbitOnWristRef = useRef<MicrobitOnWristRef>(null);
  const laptopRef = useRef<LaptopRef>(null);
  const animatedGraphLinesRef = useRef<AnimatedGraphLinesRef>(null);

  const runStep1 = useCallback(async () => {
    handHoldingMicrobitRef.current?.reset();
    animatedGraphLinesRef.current?.reset();
    handHoldingMicrobitRef.current?.show();
    stepFlowRef.current?.setStep(0, "active");
    await signalRef.current?.showConnecting();
    await Promise.all([
      signalRef.current?.showConnected(),
      handHoldingMicrobitRef.current?.displaySmileLed(),
      laptopRef.current?.displayTick(),
    ]);
    stepFlowRef.current?.setStep(0, "completed");
    await delayInSec(0.5);
  }, []);

  const runStep2 = useCallback(async () => {
    laptopRef.current?.displayNone();
    handHoldingMicrobitRef.current?.reset();
    microbitOnWristRef.current?.show({
      orientation: "horizontal",
      ledPattern: ledPatternOptions.smile,
    });
    stepFlowRef.current?.setStep(1, "active");
    await animatedGraphLinesRef.current?.play("smooth", 1);

    // Collect data for top samples.
    microbitOnWristRef.current?.setMove("wave");
    await Promise.all([
      animatedGraphLinesRef.current?.play("wavy", dataCollectionDurationInSec),
      laptopRef.current?.playDataCollectionTopSamples(),
    ]);

    // Collect data for bottom samples.
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

  useEffect(() => {
    const run = async () => {
      await runStep1();
      await runStep2();

      // Training.
      microbitOnWristRef.current?.setMove("still");
      await Promise.all([
        animatedGraphLinesRef.current?.play("smooth"),
        laptopRef.current?.playTraining(),
      ]);
    };

    void run();
  }, [runStep1, runStep2]);

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
