import { BoxProps, Grid, GridItem, Text, VStack } from "@chakra-ui/react";
import { applyFilters } from "../ml";
import { XYZData } from "../model";
import { calculateColor } from "../utils/gradient-calculator";
import ClickableTooltip from "./ClickableTooltip";
import { FormattedMessage } from "react-intl";

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
            <VStack
              textAlign="left"
              alignContent="left"
              alignItems="left"
              m={3}
            >
              <Text fontWeight="bold">
                <FormattedMessage
                  id={`fingerprint-${k}-tooltip`}
                  values={{ action: gestureName }}
                />
              </Text>
            </VStack>
          }
        >
          <GridItem
            w="100%"
            backgroundColor={calculateColor(
              dataFeatures[k],
              { r: 225, g: 255, b: 255 },
              { r: 25, g: 125, b: 188 }
            )}
          />
        </ClickableTooltip>
      ))}
    </Grid>
  );
};

export default RecordingFingerprint;
