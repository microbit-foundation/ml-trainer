import { HStack, Icon, Image, Stack, Text } from "@chakra-ui/react";
import { RiInformationLine } from "react-icons/ri";
import { FormattedMessage, useIntl } from "react-intl";
import makecodeBackImage from "./images/makecode-back.png";
import accelerometerImage from "./images/microbit_xyz_arrows.png";
import { ActionData, TourStep, TourTrigger, TourTriggerName } from "./model";

const FormattedMessageStepContent = ({ id }: { id: string }) => {
  return (
    <Text>
      <FormattedMessage id={id} />
    </Text>
  );
};

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

const MakeCodeStep = () => {
  const intl = useIntl();
  return (
    <Stack gap={5}>
      <Text>
        <FormattedMessage id="tour-makecode-intro-content1" />
      </Text>
      <HStack gap={4}>
        <Icon as={RiInformationLine} boxSize={6} />
        <Text w="fit-content">
          <FormattedMessage id="tour-makecode-intro-content2" />
          <br />
          <FormattedMessage id="tour-makecode-intro-content3" />
        </Text>
        <Image
          src={makecodeBackImage}
          w="50px"
          aspectRatio={1}
          flexShrink={0}
          borderRadius="sm"
          mx={3}
          alt={intl.formatMessage({ id: "makecode-back-alt" })}
        />
      </HStack>
    </Stack>
  );
};

const classSelector = (classname: string) => `.${classname}`;

interface TourSpec {
  steps: TourStep[];
  markCompleted: TourTriggerName[];
}

export const getTour = (
  trigger: TourTrigger,
  actions: ActionData[]
): TourSpec => {
  const hasDataSamples = actions.some((a) => a.recordings.length > 0);
  switch (trigger.name) {
    case "Connect": {
      return {
        steps: [
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
              <Text>
                <FormattedMessage id="tour-dataSamples-actionsCommon-content" />{" "}
                {!hasDataSamples && (
                  <FormattedMessage id="tour-dataSamples-actionsNoRecordings-content" />
                )}
              </Text>
            ),
          },
          ...(hasDataSamples ? createCommonDataSamplesSteps(true) : []),
        ],
        markCompleted: hasDataSamples
          ? ["Connect", "DataSamplesRecorded"]
          : ["Connect"],
      };
    }
    case "DataSamplesRecorded": {
      return {
        markCompleted: ["DataSamplesRecorded"],
        steps: [
          ...[
            {
              title: (
                <FormattedMessage
                  id="tour-collectData-afterFirst-title"
                  values={{ recordingCount: trigger.recordingCount }}
                />
              ),
              content: (
                <FormattedMessageStepContent id="tour-collectData-afterFirst-content" />
              ),
            },
          ],
          ...createCommonDataSamplesSteps(
            actions.some((a) => a.recordings.length > 1)
          ),
        ],
      };
    }
    case "TrainModel": {
      return {
        markCompleted: ["TrainModel"],
        steps: [
          {
            title: (
              <FormattedMessage
                id={
                  trigger.delayedUntilConnection
                    ? "tour-testModel-afterTrainDelayedUntilConnected-title"
                    : "tour-testModel-afterTrainAlreadyConnected-title"
                }
              />
            ),
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
            title: (
              <FormattedMessage id="tour-testModel-makeCodeBlocks-title" />
            ),
            content: (
              <FormattedMessageStepContent id="tour-testModel-makeCodeBlocks-content" />
            ),
            selector: classSelector(tourElClassname.makeCodeCodeView),
            placement: "left",
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
    }
    case "MakeCode": {
      return {
        markCompleted: ["MakeCode"],
        steps: [
          {
            title: <FormattedMessage id="tour-makecode-intro-title" />,
            content: <MakeCodeStep />,
          },
        ],
      };
    }
    default:
      throw new Error(trigger);
  }
};

const createCommonDataSamplesSteps = (hasPreExistingRecordings: boolean) => {
  return [
    {
      selector: classSelector(tourElClassname.recordDataSamplesCard),
      title: <FormattedMessage id="tour-collectData-collectMore-title" />,
      content: (
        <Text>
          <FormattedMessage
            id={
              hasPreExistingRecordings
                ? "tour-collectData-collectMoreHasRecordings-content"
                : "tour-collectData-collectMoreNoRecordings-content"
            }
          />{" "}
          <FormattedMessage id="tour-collectData-collectMoreExplanation-content" />
        </Text>
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
  ];
};
