import {
  Card,
  CardBody,
  Grid,
  GridProps,
  HStack,
  Text,
  VisuallyHidden,
} from "@chakra-ui/react";
import React from "react";
import { FormattedMessage, useIntl } from "react-intl";
import {
  Gesture,
  GestureContextState,
  useGestureActions,
  useGestureData,
} from "../gestures-hooks";
import { Confidences, mlSettings } from "../ml";
import { usePrediction } from "../ml-hooks";
import CertaintyThresholdGridItem from "./CertaintyThresholdGridItem";
import GestureNameGridItem from "./GestureNameGridItem";
import HeadingGrid from "./HeadingGrid";
import InfoToolTip from "./InfoToolTip";
import PercentageDisplay from "./PercentageDisplay";

const gridCommonProps: Partial<GridProps> = {
  gridTemplateColumns: "200px 1fr",
  gap: 3,
  px: 10,
  py: 2,
  w: "100%",
};

const headings = [
  {
    titleId: "content.model.output.action.descriptionTitle",
    descriptionId: "content.model.output.action.descriptionBody",
  },
  {
    titleId: "content.model.output.certainty.descriptionTitle",
    descriptionId: "content.model.output.certainty.descriptionBody",
  },
];

const TestModelGridView = () => {
  const intl = useIntl();
  const [gestures] = useGestureData();
  const { setRequiredConfidence } = useGestureActions();

  const confidences = usePrediction();
  const prediction = applyThresholds(gestures, confidences);
  const predicationLabel =
    prediction?.name ??
    intl.formatMessage({
      id: "content.model.output.estimatedGesture.none",
    });

  return (
    <>
      <HStack w="full" px={10} justifyContent="center">
        <Card mt={5} mb={2} w="full">
          <CardBody
            flexDirection="row"
            display="flex"
            justifyContent="space-between"
          >
            <VisuallyHidden aria-live="polite">
              <FormattedMessage
                id="content.model.output.estimatedGesture.label"
                values={{ action: predicationLabel }}
              />
            </VisuallyHidden>
            <HStack fontWeight="semibold" gap={5} flexGrow={1}>
              <Text fontSize="2xl" color="gray.600">
                <FormattedMessage id="content.model.output.estimatedGesture.iconTitle" />
              </Text>
              <Text fontSize="2xl">{predicationLabel}</Text>
            </HStack>
            <HStack justifyContent="flex-end">
              {prediction && confidences && (
                <PercentageDisplay
                  value={confidences[prediction.ID]}
                  colorScheme="green.500"
                />
              )}
              <InfoToolTip
                titleId="content.model.output.estimatedGesture.descriptionTitle"
                descriptionId="content.model.output.estimatedGesture.descriptionBody"
              />
            </HStack>
          </CardBody>
        </Card>
      </HStack>
      <HeadingGrid
        {...gridCommonProps}
        borderTopWidth={0}
        headings={headings}
      />
      <Grid
        {...gridCommonProps}
        alignItems="start"
        autoRows="max-content"
        overflow="auto"
        flexGrow={1}
        h={0}
      >
        {gestures.data.map(
          ({ ID, name, requiredConfidence: threshold }, idx) => {
            return (
              <React.Fragment key={idx}>
                <GestureNameGridItem id={ID} name={name} readOnly={true} />
                <CertaintyThresholdGridItem
                  onThresholdChange={(val) => setRequiredConfidence(ID, val)}
                  currentConfidence={confidences?.[ID]}
                  requiredConfidence={
                    threshold ?? mlSettings.defaultRequiredConfidence
                  }
                  isTriggered={prediction?.ID === ID}
                />
              </React.Fragment>
            );
          }
        )}
      </Grid>
    </>
  );
};

const applyThresholds = (
  gestureData: GestureContextState,
  confidences: Confidences | undefined
): Gesture | undefined => {
  if (!confidences) {
    return undefined;
  }

  // If more than one meet the threshold pick the highest
  const thresholded = gestureData.data
    .map((gesture) => ({
      gesture,
      thresholdDelta:
        confidences[gesture.ID] -
        (gesture.requiredConfidence ?? mlSettings.defaultRequiredConfidence),
    }))
    .sort((left, right) => {
      const a = left.thresholdDelta;
      const b = right.thresholdDelta;
      return a < b ? -1 : a > b ? 1 : 0;
    });

  const prediction = thresholded[thresholded.length - 1];
  return prediction.thresholdDelta >= 0 ? prediction.gesture : undefined;
};

export default TestModelGridView;
