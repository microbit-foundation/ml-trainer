/**
 * (c) 2024, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { useCallback } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { CardBody, cx, css, HStack, Slider, Text, VStack } from "@microbit/ui";
import RowCard from "./RowCard";
import { tourElClassname } from "../tours";
import PercentageDisplay from "./PercentageDisplay";
import PercentageMeter from "./PercentageMeter";

interface ActionCertaintyCardProps {
  requiredConfidence?: number;
  onThresholdChange: (val: number) => void;
  actionName: string;
  actionId: string;
  disabled?: boolean;
}

const ActionCertaintyCard = ({
  requiredConfidence = 0,
  onThresholdChange,
  actionName,
  actionId,
  disabled,
}: ActionCertaintyCardProps) => {
  const intl = useIntl();
  const barWidth = 240;

  const handleThresholdChange = useCallback(
    (val: number) => onThresholdChange(val * 0.01),
    [onThresholdChange]
  );
  const sliderValue = requiredConfidence * 100;
  return (
    <RowCard
      css={{ px: 4, width: "fit-content" }}
      className={cx(
        tourElClassname.certaintyThreshold,
        disabled ? css({ opacity: 0.5, pointerEvents: "none" }) : undefined
      )}
    >
      <CardBody
        css={{
          display: "flex",
          flexDirection: "column",
          px: 1,
          py: 1,
          gap: 1,
          justifyContent: "center",
        }}
      >
        <HStack w="100%" gap={5}>
          <PercentageMeter meterBarWidthPx={barWidth} actionId={actionId} />
          <PercentageDisplay actionName={actionName} actionId={actionId} />
        </HStack>
        <VStack alignItems="flex-start" gap={1}>
          <Text fontSize="sm" color="gray.600">
            <FormattedMessage id="recognition-point-label" />
          </Text>
          <Slider
            onChange={handleThresholdChange}
            aria-label={intl.formatMessage({
              id: "recognition-point-label",
            })}
            value={sliderValue}
            isDisabled={disabled}
            // Announce the value with its unit, matching the visible mark.
            formatOptions={{
              style: "unit",
              unit: "percent",
              maximumFractionDigits: 0,
            }}
            // The card already conveys the disabled state (dimmed with
            // pointer-events off), so suppress the recipe's disabled
            // restyle rather than stacking the two.
            css={{ w: "240px", "&[data-disabled]": { opacity: 1 } }}
            trackCss={{
              h: "8px",
              rounded: "full",
              "[data-disabled] &": { bg: "gray.200" },
            }}
            filledTrackCss={{ bg: "gray.600" }}
            thumbCss={{ bg: "gray.600" }}
            mark={`${sliderValue.toFixed(0)}%`}
            markCss={{
              bg: "gray.600",
              borderRadius: "sm",
              color: "white",
              fontSize: "xs",
              ml: -2,
              mt: -9,
              padding: "2px 4px",
              textAlign: "center",
              zIndex: 2,
            }}
          />
        </VStack>
      </CardBody>
    </RowCard>
  );
};

export default ActionCertaintyCard;
