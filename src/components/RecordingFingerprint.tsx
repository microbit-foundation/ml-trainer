import { BoxProps, Grid, GridItem, Text, VStack } from "@chakra-ui/react";
import { applyFilters } from "../ml";
import { XYZData } from "../model";
import { calculateColor } from "../utils/gradient-calculator";
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
  const values = applyFilters(data, { normalize: true });

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
      {values.map((v, idx) => (
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
                {/* TODO: Replace with label */}
                {gestureName}
              </Text>
            </VStack>
          }
        >
          <GridItem
            w="100%"
            backgroundColor={calculateColor(
              v,
              // TODO: Try another color
              { r: 225, g: 255, b: 255 },
              { r: 0, g: 160, b: 0 }
            )}
          />
        </ClickableTooltip>
      ))}
    </Grid>
  );
};

export default RecordingFingerprint;
