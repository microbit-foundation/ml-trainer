import { TourId, TourStep } from "./model";

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

const classSelector = (classname: string) => `.${classname}`;

// If you complete a tour then we don't show it again.
export const tours: Record<TourId, TourStep[]> = {
  // Launched when you connect a micro:bit when you have no recordings.
  // If you import data without connecting a micro:bit you're on your own for now.
  [TourId.DataSamplesPage]: [
    {
      title: "You’ve connected a micro:bit!",
      content:
        "Use the Data Samples page to record samples of movement data to train a machine learning model to recognise different actions.",
    },
    {
      selector: classSelector(tourElClassname.liveGraph),
      title: "Live graph",
      content:
        "The live graph shows movement data from the micro:bit’s accelerometer. Move the micro:bit to see the graph react.",
      spotlightPadding: 0,
    },
    {
      selector: classSelector(tourElClassname.dataSamplesActionCard),
      title: "Actions and data samples",
      content:
        "An action is the type of movement you want the machine learning tool to recognise e.g. ‘wave’ or ‘clap’. Name your first action start recording samples.",
    },
  ],
  // Launched after recording your first recording.
  [TourId.CollectDataToTrainModel]: [
    {
      title: "You’ve recorded your first sample!",
      content:
        "To train the machine learning model you need at least 3 data samples for 2 different actions.",
    },
    {
      selector: classSelector(tourElClassname.recordDataSamplesCard),
      title: "Collect more recordings",
      content:
        "Record more samples for this action. You need at least two more. Collecting more samples should result in a better model.",
    },
    {
      selector: classSelector(tourElClassname.addActionButton),
      title: "Add more actions",
      content:
        "You need at least 2 actions each with 3 data samples to train the model.",
    },
    {
      selector: classSelector(tourElClassname.trainModelButton),
      title: "Train model",
      content:
        "When you have collected all your data samples you can train the model. You can come back to collect more data to improve your model.",
    },
  ],
  // Launched after training a model
  // If you haven't connected a micro:bit this session then it'll
  // be a bit weird but we just go with it for now.
  [TourId.TestModelPage]: [
    {
      title: "You’ve trained a model!",
      content:
        "Use this page to test your model. Try each action and see if the model can detect it.",
    },
    {
      title: "Estimated action",
      content:
        "The action the model thinks you are currently doing is shown in green.",
      selector: classSelector(tourElClassname.estimatedAction),
    },
    {
      title: "Adjust the recognition point",
      content:
        "The meter shows how confident the model is that you are doing the action. Move the slider to adjust the recognition point.",
      selector: classSelector(tourElClassname.certaintyThreshold),
    },
    {
      title: "MakeCode blocks",
      content:
        "This MakeCode code shows the icon for action when it is detected by the model.",
      selector: classSelector(tourElClassname.makeCodeCodeView),
    },
    {
      title: "Microsoft MakeCode",
      content:
        "Use MakeCode to download the program to your micro:bit. Use the blocks to write your own program that uses the machine learning model.",
      selector: classSelector(tourElClassname.editInMakeCodeButton),
    },
  ],
};
