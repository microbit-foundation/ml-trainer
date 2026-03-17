/**
 * (c) 2024, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { BoxProps, Text, VisuallyHidden } from "@chakra-ui/react";
import { useCallback, useEffect, useRef } from "react";
import { useStore } from "../store";
import { useIntl } from "react-intl";

interface PercentageDisplayProps extends BoxProps {
  actionId: string;
  actionName: string;
}

const PercentageDisplay = ({
  actionId,
  actionName,
  ...rest
}: PercentageDisplayProps) => {
  const intl = useIntl();

  const textRef = useRef<HTMLParagraphElement>(null);
  const accessibleTextRef = useRef<HTMLParagraphElement>(null);

  const getAriaLabel = useCallback(
    (currentConfidence: string) =>
      intl.formatMessage(
        {
          id: "certainty-percentage-label",
        },
        { currentConfidence, action: actionName }
      ),
    [intl, actionName]
  );

  useEffect(
    () =>
      useStore.subscribe(
        // subscribe returns its own unsubscribe function
        (s) => s.predictionResult,
        (predictionResult) => {
          if (!textRef.current) return;
          textRef.current.style.backgroundColor =
            predictionResult?.detected?.id === actionId
              ? "brand2.500"
              : "gray.600";
          const confidence = Math.round(
            (predictionResult?.confidences[actionId] ?? 0) * 100
          );
          textRef.current.textContent = `${confidence}%`;
          if (accessibleTextRef.current) {
            accessibleTextRef.current.textContent = getAriaLabel(
              `${confidence}%`
            );
          }
        }
      ),
    [actionId, getAriaLabel]
  );

  return (
    <>
      <VisuallyHidden>
        <Text ref={accessibleTextRef}>{getAriaLabel("0%")}</Text>
      </VisuallyHidden>
      <Text
        ref={textRef}
        bgColor={"gray.600"}
        color="white"
        rounded="md"
        textAlign="center"
        fontSize="xl"
        w="60px"
        aria-hidden={true}
        {...rest}
      >
        0%
      </Text>
    </>
  );
};

export default PercentageDisplay;
