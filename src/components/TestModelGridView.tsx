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
import { useGestureActions, useGestureData } from "../gestures-hooks";
import { mlSettings } from "../ml";
import { getPredictedGesture, usePrediction } from "../ml-hooks";
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
  const predictedGesture = getPredictedGesture(gestures, confidences);
  const predicationLabel =
    predictedGesture?.name ??
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
              {predictedGesture && confidences && (
                <PercentageDisplay
                  value={confidences[predictedGesture.ID]}
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
          ({ ID, name, icon, requiredConfidence: threshold }, idx) => {
            return (
              <React.Fragment key={idx}>
                <GestureNameGridItem
                  id={ID}
                  name={name}
                  icon={icon}
                  readOnly={true}
                  isTriggered={predictedGesture?.ID === ID}
                />
                <CertaintyThresholdGridItem
                  onThresholdChange={(val) => setRequiredConfidence(ID, val)}
                  currentConfidence={confidences?.[ID]}
                  requiredConfidence={
                    threshold ?? mlSettings.defaultRequiredConfidence
                  }
                  isTriggered={predictedGesture?.ID === ID}
                />
              </React.Fragment>
            );
          }
        )}
      </Grid>
    </>
  );
};

export default TestModelGridView;
