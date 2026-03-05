/**
 * (c) 2026, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { Icon, useToken, VStack } from "@chakra-ui/react";
import { forwardRef, useImperativeHandle, useState } from "react";
import Tick from "./Tick";

const fontWeight = 700;
const fontSize = 20;
const height = 40;
const paddingx = 20;

interface StepTickPillProps {
  text: string;
  showTick?: boolean;
}

export interface StepTickPillRef {
  setActive(): void;
  setCompleted(): void;
  setInactive(): void;
  reset(): void;
}

const activeColor = "brand2.500";

const StepTickPill = forwardRef<StepTickPillRef, StepTickPillProps>(
  function StepTickPill({ text }: StepTickPillProps, ref) {
    const [isTickVisible, setTickVisible] = useState(false);
    const [fillColor, setFillColor] = useState("gray.500");
    useImperativeHandle(
      ref,
      () => {
        return {
          setActive() {
            setFillColor(activeColor);
          },
          setCompleted() {
            setTickVisible(true);
          },
          setInactive() {
            setFillColor("gray.500");
          },
          reset() {
            setTickVisible(false);
            setFillColor("gray.500");
          },
        };
      },
      []
    );

    const fontFamily = useToken("fonts", "heading");
    const pillWidth =
      getTextWidth({ text, fontFamily, fontWeight, fontSize }) + paddingx * 2;
    return (
      <VStack gap={3}>
        {/* Tick icon */}
        <Tick
          size="30px"
          transition={fillColor === activeColor ? "color 0.3s ease" : undefined}
          color={isTickVisible ? fillColor : "transparent"}
        />
        {/* Pill with step name */}
        <Icon
          viewBox={`0 0 ${pillWidth} ${height}`}
          width={pillWidth}
          height="37px"
          color={fillColor}
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
