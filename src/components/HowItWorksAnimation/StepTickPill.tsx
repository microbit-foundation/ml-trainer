/**
 * (c) 2026, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { Button, Heading, HStack, VStack } from "@chakra-ui/react";
import { forwardRef, useImperativeHandle, useState } from "react";
import Tick from "./Tick";

interface StepTickPillProps {
  text: string;
  inactiveColor: string;
  activeColor: string;
}

type StepState = { active: boolean; completed: boolean };
export interface StepTickPillRef {
  setState(newState: Partial<StepState>): void;
}

const StepTickPill = forwardRef<StepTickPillRef, StepTickPillProps>(
  function StepTickPill(
    { text, inactiveColor, activeColor }: StepTickPillProps,
    ref
  ) {
    const [state, setState] = useState<StepState>({
      active: false,
      completed: false,
    });
    useImperativeHandle(
      ref,
      () => {
        return {
          setState(newState) {
            setState({ ...state, ...newState });
          },
        };
      },
      [state]
    );
    const color = state.active ? activeColor : inactiveColor;
    return (
      <>
        <VStack
          gap={3}
          alignItems="center"
          display={{ base: "none", md: "flex" }}
        >
          <Tick size="30px" color={state.completed ? color : "transparent"} />
          <Button
            as="div"
            backgroundColor={color}
            textColor="white"
            border="none"
            py={0}
          >
            <Heading variant="marketing" fontSize="lg">
              {text}
            </Heading>
          </Button>
        </VStack>
        <HStack
          gap={5}
          m="auto"
          display={{ base: "flex", md: "none" }}
          w="100%"
        >
          <Button
            as="div"
            backgroundColor={state.active ? activeColor : "transparent"}
            textColor={state.active ? "white" : activeColor}
            border="none"
            size="sm"
            width="100%"
          >
            <Heading variant="marketing" fontSize="sm">
              {text}
            </Heading>
          </Button>
          <Tick
            position="absolute"
            size="15px"
            color={state.completed ? inactiveColor : "transparent"}
            right="0.5em"
          />
        </HStack>
      </>
    );
  }
);

export default StepTickPill;
