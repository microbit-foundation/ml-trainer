import { HStack, Image, Text } from "@chakra-ui/react";
import accelerometerImage from "./images/microbit_xyz_arrows.png";
import { TourId, TourStep } from "./model";
import { FormattedMessage, useIntl } from "react-intl";
import { FormattedMessageStepContent } from "./pages/Tour";

export const tourElClassname = {
  liveGraph: "live-graph",
  dataSamplesActionCard: "data-samples-action-card",
  recordDataSamplesCard: "record-data-samples-card",
  addActionButton: "add-action-button",
  trainModelButton: "train-model-button",
  estimatedAction: "estimated-action",
  certaintyThreshold: "certainty-threshold",
  makeCodeCodeView: "makecode-code-view",
  editInMakeCodeButton: "edit-in-makecode-button",
};

const LiveGraphStep = () => {
  const intl = useIntl();
  return (
    <HStack gap={5}>
      <Text>
        <FormattedMessage id="tour-dataSamples-liveGraph-content" />
      </Text>
      <Image
        src={accelerometerImage}
        w="150px"
        aspectRatio={500 / 482}
        flexShrink={0}
        alt={intl.formatMessage({ id: "accelerometer-image-alt" })}
      />
    </HStack>
  );
};

const classSelector = (classname: string) => `.${classname}`;

// If you complete a tour then we don't show it again.
export const tours: Record<TourId, TourStep[]> = {
  // Launched when you connect a micro:bit when you have no recordings.
  // If you import data without connecting a micro:bit you're on your own for now.
  [TourId.DataSamplesPage]: [
    {
      title: <FormattedMessage id="tour-dataSamples-connected-title" />,
      content: (
        <FormattedMessageStepContent id="tour-dataSamples-connected-content" />
      ),
      modalSize: "lg",
    },
    {
      selector: classSelector(tourElClassname.liveGraph),
      title: <FormattedMessage id="live-data-graph" />,
      content: <LiveGraphStep />,
      spotlightStyle: { padding: 0 },
    },
    {
      selector: classSelector(tourElClassname.dataSamplesActionCard),
      title: <FormattedMessage id="actions-label" />,
      content: (
        <FormattedMessageStepContent id="tour-dataSamples-actions-content" />
      ),
    },
  ],
  // Launched after recording your first recording.
  [TourId.CollectDataToTrainModel]: [
    {
      title: <FormattedMessage id="tour-collectData-afterFirst-title" />,
      content: (
        <FormattedMessageStepContent id="tour-collectData-afterFirst-content" />
      ),
    },
    {
      selector: classSelector(tourElClassname.recordDataSamplesCard),
      title: <FormattedMessage id="tour-collectData-collectMore-title" />,
      content: (
        <FormattedMessageStepContent id="tour-collectData-collectMore-content" />
      ),
    },
    {
      selector: classSelector(tourElClassname.addActionButton),
      title: <FormattedMessage id="tour-collectData-addActions-title" />,
      content: (
        <FormattedMessageStepContent id="tour-collectData-addActions-content" />
      ),
    },
    {
      selector: classSelector(tourElClassname.trainModelButton),
      title: <FormattedMessage id="train-model" />,
      content: (
        <FormattedMessageStepContent id="tour-collectData-trainModel-content" />
      ),
    },
  ],
  // Launched after training a model
  // If you haven't connected a micro:bit this session then it'll
  // be a bit weird but we just go with it for now.
  [TourId.TestModelPage]: [
    {
      title: <FormattedMessage id="tour-testModel-afterTrain-title" />,
      content: (
        <FormattedMessageStepContent id="tour-testModel-afterTrain-content" />
      ),
    },
    {
      title: <FormattedMessage id="estimated-action-label" />,
      content: (
        <FormattedMessageStepContent id="tour-testModel-estimatedAction-content" />
      ),
      selector: classSelector(tourElClassname.estimatedAction),
      spotlightStyle: {
        paddingLeft: 8,
        paddingRight: -8,
        paddingTop: -8,
        paddingBottom: -8,
      },
    },
    {
      title: (
        <FormattedMessage id="tour-testModel-certaintyRecognition-title" />
      ),
      content: (
        <FormattedMessageStepContent id="tour-testModel-certaintyRecognition-content" />
      ),
      selector: classSelector(tourElClassname.certaintyThreshold),
    },
    {
      title: <FormattedMessage id="tour-testModel-makeCodeBlocks-title" />,
      content: (
        <FormattedMessageStepContent id="tour-testModel-makeCodeBlocks-content" />
      ),
      selector: classSelector(tourElClassname.makeCodeCodeView),
    },
    {
      title: <FormattedMessage id="edit-in-makecode-action" />,
      content: (
        <FormattedMessageStepContent id="tour-testModel-editInMakeCode-content" />
      ),
      selector: classSelector(tourElClassname.editInMakeCodeButton),
    },
  ],
};
