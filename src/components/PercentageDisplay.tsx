/**
 * (c) 2024, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { useCallback, useEffect, useRef } from "react";
import { useIntl } from "react-intl";
import { css, Text, token } from "../shared-ui";
import { useStore } from "../store";

interface PercentageDisplayProps {
  actionId: string;
  actionName: string;
}

const PercentageDisplay = ({
  actionId,
  actionName,
}: PercentageDisplayProps) => {
  const intl = useIntl();

  const textRef = useRef<HTMLParagraphElement>(null);
  const accessibleTextRef = useRef<HTMLParagraphElement>(null);
  const triggeredColor = token("colors.brand2.500");
  const defaultColor = token("colors.gray.600");

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
              ? triggeredColor
              : defaultColor;
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
    [actionId, getAriaLabel, triggeredColor, defaultColor]
  );

  return (
    <>
      <span className={css({ srOnly: true })}>
        <Text ref={accessibleTextRef}>{getAriaLabel("0%")}</Text>
      </span>
      <Text
        ref={textRef}
        bg="gray.600"
        color="white"
        rounded="md"
        textAlign="center"
        fontSize="xl"
        w="60px"
        aria-hidden={true}
      >
        0%
      </Text>
    </>
  );
};

export default PercentageDisplay;
