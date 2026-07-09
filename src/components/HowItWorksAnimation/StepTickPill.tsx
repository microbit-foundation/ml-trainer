/**
 * (c) 2026, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { forwardRef, useImperativeHandle, useState } from "react";
import { Grid, Heading, HStack, VStack } from "../../shared-ui";
import Tick from "./Tick";

interface StepTickPillProps {
  text: string;
}

type StepState = { active: boolean; completed: boolean };
export interface StepTickPillRef {
  setState(newState: Partial<StepState>): void;
}

// Colours are written out as literals per state so Panda can extract them
// (active = brand2.500; inactive = gray.700, gray.500 from md up).
const StepTickPill = forwardRef<StepTickPillRef, StepTickPillProps>(
  function StepTickPill({ text }: StepTickPillProps, ref) {
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
    return (
      <>
        <VStack
          gap={3}
          alignItems="center"
          display={{ base: "none", md: "flex" }}
        >
          <Tick
            css={{
              width: "30px",
              height: "30px",
              color: !state.completed
                ? "transparent"
                : state.active
                ? "brand2.500"
                : { base: "gray.700", md: "gray.500" },
            }}
          />
          <HStack
            backgroundColor={
              state.active ? "brand2.500" : { base: "gray.700", md: "gray.500" }
            }
            color="white"
            border="none"
            px="1em"
            py="0.5em"
            borderRadius="full"
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
          backgroundColor={state.active ? "brand2.500" : "transparent"}
          width="100%"
          borderRadius="full"
        >
          <Grid
            // Panda's Grid pattern defaults gap to 8px; Chakra's had none.
            gap={0}
            gridTemplateColumns="1fr 2fr 1fr"
            backgroundColor={state.active ? "brand2.500" : "transparent"}
            color={
              state.active ? "white" : { base: "gray.700", md: "gray.500" }
            }
            border="none"
            width="100%"
            borderRadius="full"
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
                css={{
                  width: "15px",
                  height: "15px",
                  color: !state.completed
                    ? "transparent"
                    : state.active
                    ? "white"
                    : { base: "gray.700", md: "gray.500" },
                }}
              />
            </HStack>
          </Grid>
        </HStack>
      </>
    );
  }
);

export default StepTickPill;
