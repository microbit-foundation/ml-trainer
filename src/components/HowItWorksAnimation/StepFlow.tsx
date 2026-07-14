/**
 * (c) 2026, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { forwardRef, useImperativeHandle, useRef, useState } from "react";
import { useIntl } from "react-intl";
import { Stack } from "../../shared-ui";
import AnimationIcon, { AnimationIconProps } from "./AnimationIcon";
import StepTickPill, { StepTickPillRef } from "./StepTickPill";

type ArrowState = "hidden" | "active" | "inactive";

export interface StepFlowRef {
  setStep(stepNum: 1 | 2 | 3 | 4 | 5, state: "active" | "completed"): void;
  setTraining(): void;
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
        setStep(stepNum, state) {
          const stepIdx = stepNum - 1;
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
          if (stepIdx > 2) {
            setArrowState("inactive");
          }
          if (state === "active") {
            step.setState({ active: true, completed: false });
          }
          if (state === "completed") {
            step.setState({ active: true, completed: true });
          }
        },
        setTraining() {
          // Set first two steps as completed, but not active.
          for (let i = 0; i < 2; i++) {
            stepRefs.current[i].current?.setState({
              active: false,
              completed: true,
            });
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
    []
  );

  return (
    <Stack
      direction={{ base: "column", md: "row" }}
      justifyContent="center"
      width={{ base: "auto", md: "100%" }}
      gap={{ base: 0, sm: 0, md: 5 }}
      position="relative"
    >
      <StepTickPill
        text={intl.formatMessage({ id: "animation-step-1" })}
        ref={stepRefs.current[0]}
      />
      <StepTickPill
        text={intl.formatMessage({ id: "animation-step-2" })}
        ref={stepRefs.current[1]}
      />
      {/* Arrows for md / lg screen sizes */}
      <ArrowIcon
        css={{
          display: { base: "none", sm: "none", md: "block" },
          position: "absolute",
          left: "44%",
          width: "3em",
          top: "30%",
          // Faithful to Chakra incl. the bogus base "active" colour (the
          // browser drops it and the arrow inherits the text colour below md).
          color:
            arrowState === "hidden"
              ? "transparent"
              : arrowState === "active"
              ? { base: "active", md: "brand2.500" }
              : { base: "gray.700", md: "gray.500" },
        }}
      />
      <ArrowIcon
        css={{
          display: { base: "none", sm: "none", md: "block" },
          position: "absolute",
          left: "44%",
          width: "3em",
          bottom: "-22%",
          transform: "rotate(180deg)",
          // Faithful to Chakra incl. the bogus base "active" colour (the
          // browser drops it and the arrow inherits the text colour below md).
          color:
            arrowState === "hidden"
              ? "transparent"
              : arrowState === "active"
              ? { base: "active", md: "brand2.500" }
              : { base: "gray.700", md: "gray.500" },
        }}
      />
      {/* Arrows for base / sm screen sizes */}
      <ArrowIcon
        css={{
          display: { sm: "block", md: "none" },
          position: "absolute",
          zIndex: 1,
          top: "32%",
          left: "-2em",
          width: "2em",
          transform: "rotate(-90deg)",
          // Faithful to Chakra incl. the bogus base "active" colour (the
          // browser drops it and the arrow inherits the text colour below md).
          color:
            arrowState === "hidden"
              ? "transparent"
              : arrowState === "active"
              ? { base: "active", md: "brand2.500" }
              : { base: "gray.700", md: "gray.500" },
        }}
      />
      <ArrowIcon
        css={{
          display: { sm: "block", md: "none" },
          position: "absolute",
          zIndex: 1,
          top: "32%",
          right: "-2em",
          width: "2em",
          transform: "rotate(90deg)",
          // Faithful to Chakra incl. the bogus base "active" colour (the
          // browser drops it and the arrow inherits the text colour below md).
          color:
            arrowState === "hidden"
              ? "transparent"
              : arrowState === "active"
              ? { base: "active", md: "brand2.500" }
              : { base: "gray.700", md: "gray.500" },
        }}
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
    </Stack>
  );
});

const ArrowIcon = (props: AnimationIconProps) => (
  <AnimationIcon viewBox="0 0 68 22" baseCss={{ fill: "none" }} {...props}>
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
  </AnimationIcon>
);

export default StepFlow;
