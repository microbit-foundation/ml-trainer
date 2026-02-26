/**
 * (c) 2026, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { HStack, VStack } from "@chakra-ui/react";
import { useEffect, useRef } from "react";

import Laptop, { LaptopRef } from "./Laptop";
import Signal, { SignalRef } from "./Signal";
import StepFlow, { StepFlowRef } from "./StepFlow";
import HandHoldingMicrobit, { HandHoldingMicrobitRef } from "./HandHoldingMicrobit";

const HowItWorksAnimation = () => {
  const stepFlowRef = useRef<StepFlowRef>(null);
  const signalRef = useRef<SignalRef>(null);
  const handHoldingMicrobitRef = useRef<HandHoldingMicrobitRef>(null);
  const laptopRef = useRef<LaptopRef>(null);

  useEffect(() => {
    const run = async () => {
      // Step 1: Connect
      handHoldingMicrobitRef.current?.show();
      await signalRef.current?.showConnecting();
      await Promise.all([
        signalRef.current?.showConnected(),
        stepFlowRef.current?.setStep(0, "active"),
        handHoldingMicrobitRef.current?.displaySmileLed(),
        laptopRef.current?.displayTick(),
      ]);
      stepFlowRef.current?.setStep(0, "completed");

      // Step 2: Collect data
      handHoldingMicrobitRef.current?.reset();
      stepFlowRef.current?.setStep(1, "active");
    };

    void run();
  }, []);

  return (
    <VStack gap={7}>
      <HStack justifyContent="center" width="100%" gap={5}>
        <StepFlow ref={stepFlowRef} />
      </HStack>
      <Signal ref={signalRef} />
      <HStack alignItems="start" gap={20}>
        <HandHoldingMicrobit width={200} height={200} ref={handHoldingMicrobitRef} />
        <Laptop width={230} height="auto" ref={laptopRef} />
      </HStack>
    </VStack>
  );
};

export default HowItWorksAnimation;
