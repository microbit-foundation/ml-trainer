/**
 * (c) 2026, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { Icon, useToken, VStack } from "@chakra-ui/react";
import { forwardRef, useImperativeHandle, useMemo, useState } from "react";
import Tick from "./Tick";

const fontWeight = 700;
const fontSize = 20;
const height = 40;
const paddingx = 20;

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

    const fontFamily = useToken("fonts", "heading");
    const pillWidth = useMemo(
      () =>
        getTextWidth({ text, fontFamily, fontWeight, fontSize }) + paddingx * 2,
      [fontFamily, text]
    );
    const color = state.active ? activeColor : inactiveColor;
    return (
      <VStack gap={3}>
        {/* Tick icon */}
        <Tick size="30px" color={state.completed ? color : "transparent"} />
        {/* Pill with step name */}
        <Icon
          viewBox={`0 0 ${pillWidth} ${height}`}
          width={pillWidth}
          height="37px"
          color={color}
        >
          <rect
            x="0"
            y="0"
            width={pillWidth}
            height={height}
            rx={height / 2}
            ry={height / 2}
            fill="currentColor"
          />
          <text
            fill="#fff"
            fontFamily={fontFamily}
            fontSize={fontSize}
            fontWeight={fontWeight}
            x={pillWidth / 2}
            y={height / 2}
            dominantBaseline="central"
            textAnchor="middle"
          >
            {text}
          </text>
        </Icon>
      </VStack>
    );
  }
);
const getTextWidth = ({
  text,
  fontFamily,
  fontSize,
  fontWeight,
}: {
  text: string;
  fontFamily: string;
  fontSize: number;
  fontWeight: number;
}) => {
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  context!.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
  const width = context!.measureText(text).width;
  canvas.remove();
  return width;
};

export default StepTickPill;
