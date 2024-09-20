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

export const guidedTourSteps: Record<GuidedTour, Step[]> = {
  [GuidedTour.None]: [],
  [GuidedTour.DataSamplesPage]: dataSamplesPageTourSteps,
  [GuidedTour.CollectDataToTrainModel]: trainModelTourSteps,
  [GuidedTour.HowToTestModel]: dataSamplesPageTourSteps,
};
