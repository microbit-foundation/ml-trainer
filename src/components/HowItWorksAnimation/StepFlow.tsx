import { HStack } from "@chakra-ui/react";
import StepTickPill, { StepTickPillRef } from "./StepTickPill";
import { useIntl } from "react-intl";
import { forwardRef, useCallback, useImperativeHandle, useRef } from "react";

export interface StepFlowRef {
  setStep(stepNum: number, state: "active" | "completed"): void;
  reset(): void;
}

const StepFlow = forwardRef<StepFlowRef>(function StepFlow(_, stepFlowRef) {
  const intl = useIntl();
  const stepRefs = useRef([
    useRef<StepTickPillRef>(null),
    useRef<StepTickPillRef>(null),
    useRef<StepTickPillRef>(null),
    useRef<StepTickPillRef>(null),
    useRef<StepTickPillRef>(null),
  ]);

  const resetAllSteps = useCallback(() => {
    stepRefs.current.forEach((ref) => {
      ref.current?.reset();
    });
  }, []);

  useImperativeHandle(
    stepFlowRef,
    () => {
      return {
        setStep(stepNum, state) {
          const stepRef = stepRefs.current[stepNum];
          if (!stepRef) {
            throw new Error(`Step num does not exist: ${stepNum}`);
          }
          resetAllSteps();
          // Set all previous step as completed.
          for (let i = 0; i < stepNum; i++) {
            stepRefs.current[i].current?.setCompleted();
          }
          if (state === "active") {
            stepRef.current?.setActive();
          }
          if (state === "completed") {
            stepRef.current?.setCompleted();
          }
        },
        reset: resetAllSteps,
      };
    },
    [resetAllSteps]
  );

  return (
    <HStack justifyContent="center" width="100%" gap={5}>
      <StepTickPill
        showTick
        text={intl.formatMessage({ id: "animation-step-1" })}
        ref={stepRefs.current[0]}
      />
      <StepTickPill
        text={intl.formatMessage({ id: "animation-step-2" })}
        ref={stepRefs.current[1]}
      />
      <StepTickPill
        text={intl.formatMessage({ id: "animation-step-3" })}
        ref={stepRefs.current[2]}
      />
      <StepTickPill
        text={intl.formatMessage({ id: "animation-step-4" })}
        ref={stepRefs.current[3]}
      />
      <StepTickPill
        text={intl.formatMessage({ id: "animation-step-5" })}
        ref={stepRefs.current[4]}
      />
    </HStack>
  );
});

export default StepFlow;
