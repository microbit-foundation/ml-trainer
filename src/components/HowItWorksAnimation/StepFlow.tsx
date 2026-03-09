import { Icon, IconProps, Stack } from "@chakra-ui/react";
import { forwardRef, useImperativeHandle, useRef, useState } from "react";
import { useIntl } from "react-intl";
import StepTickPill, { StepTickPillRef } from "./StepTickPill";

const inactiveColor = "gray.500";
const activeColor = "brand2.500";

type ArrowState = "hidden" | "active" | "inactive";
const largeArrowColors: Record<ArrowState, string> = {
  hidden: "transparent",
  active: activeColor,
  inactive: inactiveColor,
};
const smallArrowColors: Record<ArrowState, string> = {
  hidden: "transparent",
  active: inactiveColor,
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

  const [arrowState, setArrowState] = useState<ArrowState>("hidden");

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
          if (stepIdx > 2 && arrowState !== "inactive") {
            setArrowState("inactive");
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
          setArrowState("inactive");
        },
        setArrows: setArrowState,
        reset() {
          stepRefs.current.forEach((ref) => {
            ref.current?.setState({ active: false, completed: false });
          });
          setArrowState("hidden");
        },
      };
    },
    [arrowState]
  );

  return (
    <Stack
      direction={{ base: "column", md: "row" }}
      justifyContent="center"
      width={{ base: "13em", md: "100%" }}
      gap={{ base: 0, sm: 0, md: 5 }}
      position="relative"
    >
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
      {/* Arrows for md / lg screen sizes */}
      <ArrowIcon
        display={{ base: "none", sm: "none", md: "block" }}
        position="absolute"
        left="44%"
        width="3em"
        top="30%"
        color={largeArrowColors[arrowState]}
      />
      <ArrowIcon
        display={{ base: "none", sm: "none", md: "block" }}
        position="absolute"
        left="44%"
        width="3em"
        bottom="-22%"
        transform="rotate(180deg)"
        color={largeArrowColors[arrowState]}
      />
      {/* Arrows for base / sm screen sizes */}
      <ArrowIcon
        display={{ sm: "block", md: "none" }}
        position="absolute"
        zIndex={2}
        top="32%"
        left="2em"
        width="2em"
        transform="rotate(-90deg)"
        color={smallArrowColors[arrowState]}
      />
      <ArrowIcon
        display={{ sm: "block", md: "none" }}
        position="absolute"
        zIndex={2}
        top="32%"
        right="2em"
        width="2em"
        transform="rotate(90deg)"
        color={smallArrowColors[arrowState]}
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
    </Stack>
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
