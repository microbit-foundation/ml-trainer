import { TourId, TourStep } from "./model";

export const tours: Record<TourId, TourStep[]> = {
  [TourId.DataSamplesPage]: [
    {
      title: "Welcome!",
      content: "Here is a tour of this Data Samples page.",
    },
    {
      selector: "#live-graph",
      title: "Live graph",
      content: "This shows live accelerometer data from the micro:bit.",
      spotlightPadding: 0,
    },
    {
      selector: "#data-samples-table",
      title: "Data samples for actions",
      content: "This is where you can collect and view data samples.",
      spotlightPadding: 0,
    },
  ],
  [TourId.CollectDataToTrainModel]: [
    {
      title: "You collected your first recording!",
      content: "Learn how to train a model.",
    },
    {
      selector: ".record-button",
      title: "Collect more recordings",
      content:
        "You need at least 3 data samples for 2 actions to train the model.",
    },
    {
      selector: "#add-action",
      title: "Add more actions",
      content:
        "You need at least 2 actions each with 3 data samples to train the model.",
    },
    {
      selector: "#train-model",
      title: "Train model",
      content:
        "You need at least 2 actions each with 3 data samples to train the model.",
    },
  ],
  [TourId.TestModelPage]: [
    {
      title: "You have a trained model!",
      content: "Learn how to test your model with a connected micro:bit.",
    },
    {
      title: "Look out for the estimated action",
      content:
        "The action with the green icon indicates that it is the estimated action.",
      selector: ".action-name-card",
    },
    {
      title: "Adjust the recognition point",
      content: "Move the slider to adjust the recognition point.",
      selector: ".certainty-threshold",
    },
    {
      title: "View your MakeCode project",
      content: "See what you can do.",
      selector: ".code-view",
    },
    {
      title: "Edit your project in MakeCode",
      content:
        "Click here to customise your machine learning micro:bit project.",
      selector: "#edit-in-makecode",
    },
  ],
};
