import {
  Card,
  CardBody,
  Grid,
  GridProps,
  HStack,
  Text,
  VisuallyHidden,
} from "@chakra-ui/react";
import React, { useMemo } from "react";
import { useGestureData } from "../gestures-hooks";
import { useMlActions } from "../ml-hooks";
import CertaintyThresholdGridItem from "./CertaintyThresholdGridItem";
import GestureNameGridItem from "./GestureNameGridItem";
import HeadingGrid from "./HeadingGrid";
import { FormattedMessage, useIntl } from "react-intl";
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
  const actions = useMlActions();
  const predicted = useMemo(() => {
    const predictedGesture = actions.getPredicted();
    return (
      predictedGesture || {
        name: intl.formatMessage({
          id: "content.model.output.estimatedGesture.none",
        }),
      }
    );
  }, [actions, intl]);

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
                values={{ action: predicted.name }}
              />
            </VisuallyHidden>
            <HStack fontWeight="semibold" gap={5} flexGrow={1}>
              <Text fontSize="2xl" color="gray.600">
                <FormattedMessage id="content.model.output.estimatedGesture.iconTitle" />
              </Text>
              <Text fontSize="2xl">{predicted.name}</Text>
            </HStack>
            <HStack justifyContent="flex-end">
              {"confidence" in predicted && (
                <PercentageDisplay
                  value={predicted.confidence.currentConfidence}
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
        {gestures.data.map(({ ID, name, confidence }, idx) => (
          <React.Fragment key={idx}>
            <GestureNameGridItem id={ID} name={name} readOnly={true} />
            <CertaintyThresholdGridItem
              onThresholdChange={(val) =>
                actions.updateGestureRequiredConfidence(ID, val)
              }
              {...confidence}
              isTriggered={"ID" in predicted && predicted.ID === ID}
            />
          </React.Fragment>
        ))}
      </Grid>
    </>
  );
};

export default TestModelGridView;
