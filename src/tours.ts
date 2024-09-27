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
      title: "Your data collection micro:bit is connected!",
      content:
        "Now you can start collecting data samples to train a machine learning (ML) model to recognise different movements.",
    },
    {
      selector: classSelector(tourElClassname.liveGraph),
      title: "Live data graph",
      content:
        "The graph shows movement data from the micro:bit’s accelerometer. Move your data collection micro:bit and see how the graph changes.",
      spotlightPadding: 0,
    },
    {
      selector: classSelector(tourElClassname.dataSamplesActionCard),
      title: "Actions",
      content:
        "An action is the type of movement you want the machine learning tool to recognise e.g. ‘waving’ or ‘clapping’. Decide what your first action will be, name it and then start recording data samples.",
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
      title: "Collect more data samples",
      content:
        "Record more samples for this action. Collecting more samples should result in a better machine learning model.",
    },
    {
      selector: classSelector(tourElClassname.addActionButton),
      title: "Add more actions",
      content:
        "Decide what your other actions will be and what you will name them. You need at least 2 actions with 3 data samples to train the model. Your data samples are only stored on your computer, they do not get sent to anyone else.",
    },
    {
      selector: classSelector(tourElClassname.trainModelButton),
      title: "Train model",
      content:
        "When you have collected enough data samples you can train the machine learning model. You can come back later to remove or add more data and re-train to make the model more reliable.",
    },
  ],
  // Launched after training a model
  // If you haven't connected a micro:bit this session then it'll
  // be a bit weird but we just go with it for now.
  [TourId.TestModelPage]: [
    {
      title: "You’ve trained an ML model!",
      content:
        "Now test your machine learning model. Try each action by moving your data collection micro:bit. Does the model detect each action?",
    },
    {
      title: "Estimated action",
      content:
        "The action the model estimates you are currently doing is shown above the micro:bit icon for that action.",
      selector: classSelector(tourElClassname.estimatedAction),
      // We really want t/b/l/r padding here as the spotlight needs more padding on the left.
      spotlightPadding: 10,
    },
    {
      title: "Certainty and recognition point",
      content:
        "The meter shows how confident the model is that you are doing each action. Move the slider to adjust the recognition point, or threshold.",
      selector: classSelector(tourElClassname.certaintyThreshold),
    },
    {
      title: "Microsoft MakeCode blocks",
      content:
        "These MakeCode blocks will show icons for each action detected when you transfer your code and model to a micro:bit.",
      selector: classSelector(tourElClassname.makeCodeCodeView),
    },
    {
      title: "Edit in MakeCode",
      content:
        "Open your project in MakeCode to download the program and your machine learning model to a micro:bit. You can add more blocks to create your own programs using your model.",
      selector: classSelector(tourElClassname.editInMakeCodeButton),
    },
  ],
};
