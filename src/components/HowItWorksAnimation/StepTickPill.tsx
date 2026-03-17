/**
 * (c) 2026, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { Grid, Heading, HStack, VStack } from "@chakra-ui/react";
import { forwardRef, useImperativeHandle, useState } from "react";
import Tick from "./Tick";

interface StepTickPillProps {
  text: string;
  inactiveColor: string | object;
  activeColor: string | object;
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
            setState((prev) => ({ ...prev, ...newState }));
          },
        };
      },
      []
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
          <HStack
            backgroundColor={color}
            textColor="white"
            border="none"
            px="1em"
            py="0.5em"
            rounded="full"
          >
            <Heading variant="marketing" fontSize="lg">
              {text}
            </Heading>
          </HStack>
        </VStack>
        <HStack
          gap={5}
          m="auto"
          display={{ base: "flex", md: "none" }}
          w="100%"
          backgroundColor={state.active ? activeColor : "transparent"}
          width="100%"
          rounded="full"
        >
          <Grid
            templateColumns="1fr 2fr 1fr"
            backgroundColor={state.active ? activeColor : "transparent"}
            textColor={state.active ? "white" : inactiveColor}
            border="none"
            width="100%"
            rounded="full"
            py="0.4em"
            px="1em"
          >
            <HStack />
            <HStack justifyContent="center">
              <Heading variant="marketing" fontSize="sm">
                {text}
              </Heading>
            </HStack>
            <HStack justifyContent="center">
              <Tick
                size="15px"
                color={
                  state.completed
                    ? state.active
                      ? "white"
                      : inactiveColor
                    : "transparent"
                }
              />
            </HStack>
          </Grid>
        </HStack>
      </>
    );
  }
);

export default StepTickPill;
