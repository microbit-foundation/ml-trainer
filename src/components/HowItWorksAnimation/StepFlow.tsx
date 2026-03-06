import { HStack, Icon, IconProps } from "@chakra-ui/react";
import { forwardRef, useImperativeHandle, useRef, useState } from "react";
import { useIntl } from "react-intl";
import StepTickPill, { StepTickPillRef } from "./StepTickPill";

const inactiveColor = "gray.500";
const activeColor = "brand2.500";

type ArrowState = "hidden" | "active" | "inactive";
const arrowColors: Record<ArrowState, string> = {
  hidden: "transparent",
  active: activeColor,
  inactive: inactiveColor,
};

const commonStepTickPillProps = {
  inactiveColor,
  activeColor,
};
export interface StepFlowRef {
  setStep(stepNum: number, state: "active" | "completed"): void;
  setAllInactive(): void;
  setArrows(state: ArrowState): void;
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

  const [arrowColor, setArrowColor] = useState<string>(arrowColors.hidden);

  useImperativeHandle(
    stepFlowRef,
    () => {
      return {
        setStep(stepIdx, state) {
          const step = stepRefs.current[stepIdx].current;
          if (!step) {
            throw new Error(`Step num does not exist: ${stepIdx}`);
          }
          // Set all previous step as inactive and completed.
          for (let i = 0; i < stepIdx; i++) {
            stepRefs.current[i].current?.setState({
              active: false,
              completed: true,
            });
          }
          // Set arrow as inactive if past step 3 (index 2).
          if (stepIdx > 2 && arrowColor !== arrowColors.inactive) {
            setArrowColor(arrowColors.inactive);
          }
          if (state === "active") {
            step.setState({ active: true, completed: false });
          }
          if (state === "completed") {
            step.setState({ active: true, completed: true });
          }
        },
        setAllInactive() {
          stepRefs.current.forEach((ref) => {
            ref.current?.setState({ active: false });
          });
          setArrowColor(arrowColors.inactive);
        },
        setArrows(state) {
          setArrowColor(arrowColors[state]);
        },
        reset() {
          stepRefs.current.forEach((ref) => {
            ref.current?.setState({ active: false, completed: false });
          });
          setArrowColor(arrowColors.hidden);
        },
      };
    },
    [arrowColor]
  );

  return (
    <HStack justifyContent="center" width="100%" gap={5} position="relative">
      <StepTickPill
        text={intl.formatMessage({ id: "animation-step-1" })}
        ref={stepRefs.current[0]}
        {...commonStepTickPillProps}
      />
      <StepTickPill
        text={intl.formatMessage({ id: "animation-step-2" })}
        ref={stepRefs.current[1]}
        {...commonStepTickPillProps}
      />
      <ArrowIcon
        position="absolute"
        left="44%"
        width="3em"
        top="30%"
        color={arrowColor}
      />
      <ArrowIcon
        position="absolute"
        left="44%"
        width="3em"
        bottom="-20%"
        transform="rotate(180deg)"
        color={arrowColor}
      />
      <StepTickPill
        text={intl.formatMessage({ id: "animation-step-3" })}
        ref={stepRefs.current[2]}
        {...commonStepTickPillProps}
      />
      <StepTickPill
        text={intl.formatMessage({ id: "animation-step-4" })}
        ref={stepRefs.current[3]}
        {...commonStepTickPillProps}
      />
      <StepTickPill
        text={intl.formatMessage({ id: "animation-step-5" })}
        ref={stepRefs.current[4]}
        {...commonStepTickPillProps}
      />
    </HStack>
  );
});

const ArrowIcon = (props: IconProps) => (
  <Icon viewBox="0 0 68 22" fill="none" {...props}>
    <g>
      <path
        d="M3.06134 18.999C11.0932 9.67987 21.9073 3.99902 33.8763 3.99902C45.8453 3.99902 56.1345 9.42456 64.0613 18.2969"
        stroke="currentColor"
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M64.285 6.67383L64.8772 18.2063L53.4495 18.8039"
        stroke="currentColor"
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </g>
  </Icon>
);

export default StepFlow;
