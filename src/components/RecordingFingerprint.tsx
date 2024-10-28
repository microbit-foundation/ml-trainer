import { BoxProps, Grid, GridItem, Text } from "@chakra-ui/react";
import { FormattedMessage } from "react-intl";
import { applyFilters } from "../ml";
import { XYZData } from "../model";
import { calculateGradientColor } from "../utils/gradient-calculator";
import ClickableTooltip from "./ClickableTooltip";
import { useStore } from "../store";

interface RecordingFingerprintProps extends BoxProps {
  data: XYZData;
  gestureName: string;
}

const RecordingFingerprint = ({
  data,
  gestureName,
  ...rest
}: RecordingFingerprintProps) => {
  const dataWindow = useStore((s) => s.dataWindow);
  const dataFeatures = applyFilters(data, dataWindow, { normalize: true });

  return (
    <Grid
      w="80px"
      h="100%"
      position="relative"
      borderRadius="md"
      borderWidth={1}
      borderColor="gray.200"
      overflow="hidden"
      templateColumns={`repeat(${Object.keys(dataFeatures).length}, 1fr)`}
      {...rest}
    >
      {Object.keys(dataFeatures).map((k, idx) => (
        <ClickableTooltip
          key={idx}
          label={
            <Text p={3}>
              <FormattedMessage
                id={`fingerprint-${k}-tooltip`}
                values={{ action: gestureName }}
              />
            </Text>
          }
        >
          <GridItem
            w="100%"
            backgroundColor={calculateGradientColor("#007DBC", dataFeatures[k])}
          />
        </ClickableTooltip>
      ))}
    </Grid>
  );
};

export default RecordingFingerprint;
