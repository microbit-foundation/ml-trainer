import { Step } from "react-joyride";
import { GuidedTour } from "./model";

const commonStepConfig: Partial<Step> = {
  spotlightPadding: 0,
  disableBeacon: true,
};

const dataSamplesPageTourSteps: Step[] = [
  {
    target: "body",
    title: "Welcome!",
    content: "Here is a tour of this Data Samples page.",
    placement: "center" as const,
    ...commonStepConfig,
  },
  {
    target: "#live-graph",
    title: "Live graph",
    content: "This shows live accelerometer data from the micro:bit.",
    ...commonStepConfig,
  },
  {
    target: "#data-samples-table",
    title: "Data samples for actions",
    content: "This is where you can collect and view data samples.",
    ...commonStepConfig,
  },
];

export const guidedTourSteps: Record<GuidedTour, Step[]> = {
  [GuidedTour.None]: [],
  [GuidedTour.DataSamplesPage]: dataSamplesPageTourSteps,
  [GuidedTour.HowToTestModel]: dataSamplesPageTourSteps,
  [GuidedTour.HowToTrainModel]: dataSamplesPageTourSteps,
};
