import { Step } from "react-joyride";
import { GuidedTour } from "./model";

const dataSamplesPageTourSteps: Step[] = [
  {
    target: "body",
    title: "Welcome!",
    content: "Here is a tour of this Data Samples page.",
    placement: "center" as const,
    disableBeacon: true,
  },
  {
    target: "#live-graph",
    title: "Live graph",
    content: "This shows live accelerometer data from the micro:bit.",
    spotlightPadding: 0,
    disableBeacon: true,
  },
  {
    target: "#data-samples-table",
    title: "Data samples for actions",
    content: "This is where you can collect and view data samples.",
    spotlightPadding: 0,
    disableBeacon: true,
  },
];

const trainModelTourSteps: Step[] = [
  {
    target: "body",
    title: "You collected your first recording!",
    content: "Learn how to train a model.",
    placement: "center" as const,
    disableBeacon: true,
  },
  {
    target: ".record-button",
    title: "Collect more recordings",
    content:
      "You need at least 3 data samples for 2 actions to train the model.",
    disableBeacon: true,
  },
  {
    target: "#add-action",
    title: "Add more actions",
    content:
      "You need at least 2 actions each with 3 data samples to train the model.",
    disableBeacon: true,
  },
  {
    target: "#train-model",
    title: "Train model",
    content:
      "You need at least 2 actions each with 3 data samples to train the model.",
    disableBeacon: true,
  },
];

const testModelPageTourSteps: Step[] = [
  {
    title: "You have a trained model!",
    content: "Learn how to test your model with a connected micro:bit.",
    target: "body",
    placement: "center" as const,
    disableBeacon: true,
  },
  {
    title: "Look out for the estimated action",
    content:
      "The action with the green icon indicates that it is the estimated action.",
    target: ".action-name-card",
    disableBeacon: true,
  },
  {
    title: "Adjust the recognition point",
    content: "Move the slider to adjust the recognition point.",
    target: ".certainty-threshold",
    disableBeacon: true,
  },
  {
    title: "View your MakeCode project",
    content: "See what you can do.",
    target: ".code-view",
    disableBeacon: true,
  },
  {
    title: "Edit your project in MakeCode",
    content: "Click here to customise your machine learning micro:bit project.",
    target: "#edit-in-makecode",
    disableBeacon: true,
  },
];

export const guidedTourSteps: Record<GuidedTour, Step[]> = {
  [GuidedTour.None]: [],
  [GuidedTour.DataSamplesPage]: dataSamplesPageTourSteps,
  [GuidedTour.CollectDataToTrainModel]: trainModelTourSteps,
  [GuidedTour.TestModelPage]: testModelPageTourSteps,
};
