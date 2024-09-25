import {
  Card,
  CardBody,
  GridItem,
  HStack,
  Slider,
  SliderFilledTrack,
  SliderMark,
  SliderThumb,
  SliderTrack,
  Text,
  VStack,
} from "@chakra-ui/react";
import { useCallback, useMemo } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import PercentageDisplay from "./PercentageDisplay";
import PercentageMeter from "./PercentageMeter";

const markClass = "CertaintyThresholdGridItem--mark";

interface CertaintyThresholdGridItemProps {
  requiredConfidence?: number;
  currentConfidence?: number;
  onThresholdChange: (val: number) => void;
  isTriggered: boolean;
}

const CertaintyThresholdGridItem = ({
  requiredConfidence = 0,
  currentConfidence = 0,
  onThresholdChange,
  isTriggered,
}: CertaintyThresholdGridItemProps) => {
  const intl = useIntl();
  const barWidth = 240;
  const colorScheme = useMemo(
    () => (isTriggered ? "green.500" : undefined),
    [isTriggered]
  );

  const handleThresholdChange = useCallback(
    (val: number) => onThresholdChange(val * 0.01),
    [onThresholdChange]
  );
  const sliderValue = requiredConfidence * 100;
  return (
    <GridItem>
      <Card
        py={2}
        px={4}
        h="120px"
        display="flex"
        flexDirection="row"
        width="fit-content"
        borderWidth={1}
        borderColor="transparent"
      >
        <CardBody
          display="flex"
          flexDirection="column"
          p={1}
          gap={1}
          justifyContent="center"
        >
          <HStack w="100%" gap={5}>
            <PercentageMeter
              meterBarWidthPx={barWidth}
              value={currentConfidence}
              colorScheme={colorScheme}
            />
            <PercentageDisplay
              value={currentConfidence}
              colorScheme={colorScheme}
            />
          </HStack>
          <VStack alignItems="left" gap={1}>
            <Text fontSize="sm" textColor="gray.600">
              <FormattedMessage id="content.model.output.recognitionPoint" />
            </Text>
            <Slider
              onChange={handleThresholdChange}
              aria-label={intl.formatMessage({
                id: "content.model.output.recognitionPoint",
              })}
              _focusWithin={{
                [`.${markClass}`]: {
                  display: "block",
                },
              }}
              value={sliderValue}
              w={`${barWidth}px`}
            >
              <SliderMark
                display="none" // Overriden by the class on hover
                className={markClass}
                bg="gray.600"
                borderRadius="sm"
                color="white"
                fontSize="xs"
                ml={-2}
                mt={-9}
                padding="2px 4px"
                textAlign="center"
                value={sliderValue}
                zIndex={2}
              >
                {sliderValue.toFixed(0)}%
              </SliderMark>
              <SliderTrack h="8px" rounded="full">
                <SliderFilledTrack bg="gray.600" />
              </SliderTrack>
              <SliderThumb bg="gray.600" />
            </Slider>
          </VStack>
        </CardBody>
      </Card>
    </GridItem>
  );
};

export default CertaintyThresholdGridItem;
