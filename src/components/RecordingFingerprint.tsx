/**
 * (c) 2024, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import React, { ComponentProps } from "react";
import { Box, Text } from "../shared-ui";
import { FormattedMessage } from "react-intl";
import { applyFilters } from "../ml";
import { XYZData } from "../model";
import { useStore } from "../store";
import { calculateGradientColor } from "../utils/gradient-calculator";
import ClickableTooltip from "./ClickableTooltip";

interface RecordingFingerprintProps extends ComponentProps<typeof Box> {
  data: XYZData;
  size: "sm" | "md";
}

const RecordingFingerprint = ({
  data,
  size,
  ...rest
}: RecordingFingerprintProps) => {
  const dataWindow = useStore((s) => s.dataWindow);
  const dataFeatures = applyFilters(data, dataWindow, { normalize: true });

  return (
    <Box
      display="grid"
      w={size === "md" ? "158px" : "92px"}
      h="100%"
      position="relative"
      borderRadius="md"
      borderWidth={1}
      borderColor="gray.200"
      overflow="hidden"
      // Column count follows the data, so it can't be statically extracted.
      style={{
        gridTemplateColumns: `repeat(${Object.keys(dataFeatures).length}, 1fr)`,
      }}
      {...rest}
    >
      {Object.keys(dataFeatures).map((k) => (
        <ClickableTooltip
          placement="right bottom"
          key={k}
          label={
            <Text p={3}>
              <FormattedMessage id={`fingerprint-${k}-tooltip`} />
            </Text>
          }
        >
          <Box
            w="100%"
            style={{
              backgroundColor: calculateGradientColor(
                "#007DBC",
                dataFeatures[k]
              ),
            }}
          />
        </ClickableTooltip>
      ))}
    </Box>
  );
};

export default React.memo(RecordingFingerprint);
