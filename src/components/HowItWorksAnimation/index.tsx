/**
 * (c) 2026, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { Box, HStack, VisuallyHidden, VStack } from "@chakra-ui/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useIntl } from "react-intl";
import { useAnimation } from "../AnimationProvider";
import Arrow, { ArrowRef } from "./Arrow";
import { dataCollectionDurationInSec } from "./DataSamplesCollection";
import GraphLines, { GraphLinesRef } from "./GraphLines";
import HandHoldingMicrobit, {
  HandHoldingMicrobitRef,
} from "./HandHoldingMicrobit";
import Computer, { ComputerRef } from "./Computer";
import Layout, { LayoutRef } from "./Layout";
import MicrobitOnWrist, { MicrobitOnWristRef } from "./MicrobitOnWrist";
import Signal, { SignalRef } from "./Signal";
import StepFlow, { StepFlowRef } from "./StepFlow";
import { testModeldurationInSec } from "./TestModelScreen";

const fadeInOutDuration = 2; //s
const duration = {
  connect: {
    completed: 0.5, // Pause after completion.
  },
  collectData: {
    prep: 1, // Before collecting data.
    action: dataCollectionDurationInSec, // Collecting a data samples row.
  },
  training: {
    action: 2, // Training duration.
  },
  testingModel: {
    prep: 0.3, // Before testing model.
    action: testModeldurationInSec, // Testing an action.
    pause: 0.3, // Pause between testing actions.
    stepPause: 0.5, // Pause between steps / arrows.
  },
  code: {
    prep: 1.3, // Before coding.
    download: 2, // Downloading code.
  },
  use: {
    prep: 1, // Before using.
    pauseBeforeAction: 1, // Pause before action.
    action: 3, // Trying out each action.
  },
};

const HowItWorksAnimation = () => {
  const intl = useIntl();
  const { delayInSec, restartAbortController } = useAnimation();
  const stepFlowRef = useRef<StepFlowRef>(null);
  const signalRef = useRef<SignalRef>(null);
  const codeArrowRef = useRef<ArrowRef>(null);
  const handHoldingMicrobitRef = useRef<HandHoldingMicrobitRef>(null);
  const microbitOnWristRef = useRef<MicrobitOnWristRef>(null);
  const computerRef = useRef<ComputerRef>(null);
  const graphLinesRef = useRef<GraphLinesRef>(null);
  const layoutRef = useRef<LayoutRef>(null);
  const [visible, setVisible] = useState<boolean>(true);

  const cleanUp = useCallback(() => {
    handHoldingMicrobitRef.current?.reset();
    graphLinesRef.current?.reset();
    microbitOnWristRef.current?.reset();
    stepFlowRef.current?.reset();
    computerRef.current?.reset();
    signalRef.current?.reset();
    layoutRef.current?.reset();
    codeArrowRef.current?.reset();
  }, []);

  const runConnect = useCallback(async () => {
    // Setup.
    stepFlowRef.current?.setStep(1, "active");
    handHoldingMicrobitRef.current?.show();
    computerRef.current?.setVisible(true);

    // Connecting.
    await signalRef.current?.playConnecting();

    // Connected.
    await Promise.all([
      signalRef.current?.playConnected(),
      handHoldingMicrobitRef.current?.displayHappyLed(),
      computerRef.current?.setDisplay("tick"),
    ]);

    stepFlowRef.current?.setStep(1, "completed");
    await delayInSec(duration.connect.completed);

    // Clean up.
    cleanUp();
  }, [cleanUp, delayInSec]);

  const runCollectData = useCallback(async () => {
    // Setup.
    computerRef.current?.setVisible(true);
    stepFlowRef.current?.setStep(2, "active");
    signalRef.current?.connected();

    // Before data collection.
    await Promise.all([
      microbitOnWristRef.current?.play({
        move: "still",
        ledPattern: "Happy",
        duration: duration.collectData.prep,
      }),
      graphLinesRef.current?.play("smooth", duration.collectData.prep),
    ]);

    // Collect data for wave movement.
    await Promise.all([
      microbitOnWristRef.current?.play({
        move: "wave",
        ledPattern: "Happy",
        duration: duration.collectData.action,
      }),
      graphLinesRef.current?.play("wavy", duration.collectData.action),
      computerRef.current?.getDataSamples()?.playTopSamples(),
    ]);

    // Collect data for up down movement.
    await Promise.all([
      microbitOnWristRef.current?.play({
        move: "bob",
        ledPattern: "Happy",
        duration: duration.collectData.action,
      }),
      graphLinesRef.current?.play("chaotic", duration.collectData.action),
      computerRef.current?.getDataSamples()?.playBottomSamples(),
    ]);

    stepFlowRef.current?.setStep(2, "completed");

    // Clean up.
    cleanUp();
  }, [cleanUp]);

  const runTraining = useCallback(async () => {
    // Setup.
    signalRef.current?.connected();
    computerRef.current?.setVisible(true);
    stepFlowRef.current?.setTraining();

    await Promise.all([
      microbitOnWristRef.current?.play({
        move: "still",
        ledPattern: "Happy",
        duration: duration.training.action,
      }),
      graphLinesRef.current?.play("smooth", duration.training.action),
      computerRef.current?.playTraining(duration.training.action),
    ]);

    // Clean up.
    cleanUp();
  }, [cleanUp]);

  const runTestModel = useCallback(async () => {
    // Setup
    signalRef.current?.connected();
    stepFlowRef.current?.setStep(3, "active");
    computerRef.current?.setVisible(true);
    computerRef.current?.getTestModel()?.show();
    await Promise.all([
      microbitOnWristRef.current?.play({
        ledPattern: "Happy",
        move: "still",
        duration: duration.testingModel.prep,
      }),
      graphLinesRef.current?.play("smooth", duration.testingModel.prep),
    ]);

    // Test model for wave movement.
    await Promise.all([
      microbitOnWristRef.current?.play({
        ledPattern: "Happy",
        move: "wave",
        duration: duration.testingModel.action,
      }),
      graphLinesRef.current?.play("wavy", duration.testingModel.action),
      computerRef.current?.getTestModel()?.playAction1(),
    ]);

    // Pause between testing actions.
    await Promise.all([
      microbitOnWristRef.current?.play({
        ledPattern: "Happy",
        move: "still",
        duration: duration.testingModel.pause,
      }),
      graphLinesRef.current?.play("smooth", duration.testingModel.pause),
    ]);

    // Test model for up down movement.
    await Promise.all([
      microbitOnWristRef.current?.play({
        ledPattern: "Happy",
        move: "bob",
        duration: duration.testingModel.action,
      }),
      graphLinesRef.current?.play("chaotic", duration.testingModel.action),
      computerRef.current?.getTestModel()?.playAction2(),
    ]);

    // Show iterative flow.
    await microbitOnWristRef.current?.play({
      ledPattern: "Happy",
      move: "still",
      duration: duration.testingModel.stepPause,
    });
    await graphLinesRef.current?.fadeOut();

    stepFlowRef.current?.setArrows("active");
    await delayInSec(duration.testingModel.stepPause);
    stepFlowRef.current?.setStep(3, "completed");
    await delayInSec(duration.testingModel.stepPause);

    stepFlowRef.current?.setAllInactive();
    computerRef.current?.setDisplay("none");
    await delayInSec(duration.testingModel.stepPause);

    // Clean up.
    cleanUp();
  }, [cleanUp, delayInSec]);

  const runCode = useCallback(async () => {
    // Setup.
    signalRef.current?.connected();
    computerRef.current?.setVisible(true);
    computerRef.current?.getCodeBlock()?.show();
    stepFlowRef.current?.setStep(4, "active");
    await microbitOnWristRef.current?.play({
      ledPattern: "Happy",
      move: "still",
      duration: duration.code.prep,
    });

    // Code.
    await computerRef.current?.getCodeBlock()?.play();
    stepFlowRef.current?.setStep(4, "completed");

    // Download program.
    await Promise.all([
      codeArrowRef.current?.play(duration.code.download),
      microbitOnWristRef.current?.play({
        move: "still",
        ledPattern: "off",
        duration: duration.code.download,
      }),
    ]);

    // Clean up.
    cleanUp();
  }, [cleanUp]);

  const runUse = useCallback(async () => {
    // Setup.
    signalRef.current?.hide();
    stepFlowRef.current?.setStep(5, "active");
    await Promise.all([
      microbitOnWristRef.current?.play({
        ledPattern: "off",
        move: "still",
        duration: duration.use.prep,
      }),
      layoutRef.current?.playCenteringLeft(duration.use.prep),
    ]);
    await delayInSec(duration.use.pauseBeforeAction);

    // Use.
    await microbitOnWristRef.current?.play({
      ledPattern: "Heart",
      move: "wave",
      backgroundMode: "sparkly-heart",
      duration: duration.use.action,
    });
    stepFlowRef.current?.setStep(5, "completed");
    await microbitOnWristRef.current?.play({
      ledPattern: "No",
      move: "bob",
      backgroundMode: "sparkly-cross",
      duration: duration.use.action,
    });

    // Clean up.
    cleanUp();
  }, [cleanUp, delayInSec]);

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
        } catch (e) {
          if (e instanceof DOMException && e.name === "AbortError") {
            // Abort running animation.
            return;
          }
          throw e;
        }
      }
    };

    restartAbortController();
    void run();
  }, [
    runConnect,
    runCollectData,
    runTestModel,
    runTraining,
    runCode,
    runUse,
    cleanUp,
    delayInSec,
    restartAbortController,
  ]);

  return (
    <>
      <VisuallyHidden>
        <Box
          as="img"
          aria-label={intl.formatMessage({ id: "animation-label" })}
        />
      </VisuallyHidden>
      <VStack
        aria-hidden
        gap={7}
        opacity={visible ? 1 : 0}
        transition={`opacity ${fadeInOutDuration}s ease`}
        height={{ base: "28em", sm: "30em", md: "23em" }}
        position="relative"
        overflow="hidden"
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
              <GraphLines ref={graphLinesRef} />
              <Arrow ref={codeArrowRef} />
            </>
          }
          rightItems={
            <Computer
              height="auto"
              ref={computerRef}
              width={{ base: "100%", sm: "80%", md: "60%" }}
            />
          }
        />
      </VStack>
    </>
  );
};

export default HowItWorksAnimation;
