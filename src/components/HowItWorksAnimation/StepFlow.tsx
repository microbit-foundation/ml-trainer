import { HStack } from "@chakra-ui/react";
import StepTickPill, { StepTickPillRef } from "./StepTickPill";
import { useIntl } from "react-intl";
import { forwardRef, useImperativeHandle, useRef } from "react";

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
  useImperativeHandle(
    stepFlowRef,
    () => {
      return {
        setStep(stepNum, state) {
          const stepRef = stepRefs.current[stepNum];
          if (!stepRef) {
            throw new Error(`Step num does not exist: ${stepNum}`);
          }
          if (state === "active") {
            // Reset activeness, before setting one active.
            stepRefs.current.forEach((ref) => {
              ref.current?.setInactive();
            });
            stepRef.current?.setActive();
          }
          if (state === "completed") {
            stepRef.current?.setCompleted();
          }
        },
        reset() {},
      };
    },
    [stepRefs]
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
