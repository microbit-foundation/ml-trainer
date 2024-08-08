import {
  Grid,
  GridProps,
  Icon,
  VStack,
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
import { RiArrowRightLine } from "react-icons/ri";

const gridCommonProps: Partial<GridProps> = {
  gridTemplateColumns: "200px 360px 40px 1fr",
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
  {},
  {
    titleId: "content.model.output.output.descriptionTitle",
    descriptionId: "content.model.output.output.descriptionBody",
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
      <VisuallyHidden aria-live="polite">
        <FormattedMessage
          id="content.model.output.estimatedGesture.label"
          values={{ action: predicationLabel }}
        />
      </VisuallyHidden>
      <HeadingGrid {...gridCommonProps} headings={headings} />
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
                <VStack justifyContent="center" h="full">
                  <Icon as={RiArrowRightLine} boxSize={10} color="gray.600" />
                </VStack>
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
