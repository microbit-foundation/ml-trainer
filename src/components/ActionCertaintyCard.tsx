/**
 * (c) 2024, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { useCallback } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import {
  Card,
  CardBody,
  cx,
  css,
  HStack,
  Slider,
  Text,
  VStack,
} from "../shared-ui";
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
    <Card
      className={cx(
        tourElClassname.certaintyThreshold,
        css({
          py: 2,
          px: 4,
          h: "120px",
          display: "flex",
          flexDirection: "row",
          width: "fit-content",
          borderWidth: "1px",
          borderStyle: "solid",
          borderColor: "transparent",
        }),
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
            css={{ w: "240px" }}
            trackCss={{ h: "8px", rounded: "full" }}
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
    </Card>
  );
};

export default ActionCertaintyCard;
