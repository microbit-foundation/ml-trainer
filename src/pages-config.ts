import resourceGetStartedImage from "./images/resource-get-started.jpg";
import resourceIntroducingToolImage from "./images/resource-introducing-tool.jpg";
import DataSamplesPage from "./pages/DataSamplesPage";
import GetStartedResourcePage from "./pages/GetStartedResourcePage";
import IntroducingToolResourcePage from "./pages/IntroducingToolResourcePage";
import TestingModelPage from "./pages/TestingModelPage";

export enum SessionPageId {
  DataSamples = "data-samples",
  TestingModel = "testing-model",
}

export interface SessionPageConfig {
  id: SessionPageId;
  pageElement: () => JSX.Element;
}

export const sessionPageConfigs: SessionPageConfig[] = [
  {
    id: SessionPageId.DataSamples,
    pageElement: DataSamplesPage,
  },
  {
    id: SessionPageId.TestingModel,
    pageElement: TestingModelPage,
  },
];

export type ResourceId = "introducing-the-microbit-ai-creator" | "get-started";

export interface ResourceConfig {
  id: ResourceId;
  imgSrc: string;
  videoId: string;
  videoTitleId: string;
  pageElement: () => JSX.Element;
}

export const getStartedResouceConfig: ResourceConfig = {
  id: "get-started",
  imgSrc: resourceGetStartedImage,
  pageElement: GetStartedResourcePage,
  videoId: "XTq0Z3SdbQw",
  videoTitleId: "resources.getStarted.video",
};

export const introducingToolResouceConfig: ResourceConfig = {
  id: "introducing-the-microbit-ai-creator",
  imgSrc: resourceIntroducingToolImage,
  pageElement: IntroducingToolResourcePage,
  videoId: "EArs-Xa7-Ag",
  videoTitleId: "resources.introduction.video",
};

export const resourcesConfig: ResourceConfig[] = [
  introducingToolResouceConfig,
  getStartedResouceConfig,
];
