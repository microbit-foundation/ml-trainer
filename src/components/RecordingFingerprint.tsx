import { BoxProps, Grid, GridItem, Text, VStack } from "@chakra-ui/react";
import { FormattedMessage } from "react-intl";
import { applyFilters } from "../ml";
import { XYZData } from "../model";
import { calculateGradientColor } from "../utils/gradient-calculator";
import ClickableTooltip from "./ClickableTooltip";

interface RecordingFingerprintProps extends BoxProps {
  data: XYZData;
  gestureName: string;
}

const RecordingFingerprint = ({
  data,
  gestureName,
  ...rest
}: RecordingFingerprintProps) => {
  const dataFeatures = applyFilters(data, { normalize: true });

  return (
    <Grid
      w="80px"
      h="100%"
      position="relative"
      borderRadius="md"
      borderWidth={1}
      borderColor="gray.200"
      overflow="hidden"
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
