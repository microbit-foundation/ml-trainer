import resourceGetStartedImage from "./images/resource-get-started.jpg";
import resourceIntroducingToolImage from "./images/resource-introducing-tool.jpg";
import AddDataPage from "./pages/AddDataPage";
import GetStartedResourcePage from "./pages/GetStartedResourcePage";
import IntroducingToolResourcePage from "./pages/IntroducingToolResourcePage";
import TestModelPage from "./pages/TestModelPage";

export enum TabId {
  Data = "data",
  Model = "model",
}

export interface TabConfig {
  id: TabId;
  pageElement: () => JSX.Element;
}

export const addDataConfig: TabConfig = {
  id: TabId.Data,
  pageElement: AddDataPage,
};

export const testModelConfig: TabConfig = {
  id: TabId.Model,
  pageElement: TestModelPage,
};

export const tabConfigs: TabConfig[] = [
  {
    id: TabId.Data,
    pageElement: AddDataPage,
  },
  {
    id: TabId.Model,
    pageElement: TestModelPage,
  },
];

export type ResourceId =
  | "introducing-the-microbit-machine-learning-tool"
  | "get-started";

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
  id: "introducing-the-microbit-machine-learning-tool",
  imgSrc: resourceIntroducingToolImage,
  pageElement: IntroducingToolResourcePage,
  videoId: "EArs-Xa7-Ag",
  videoTitleId: "resources.introduction.video",
};

export const resourcesConfig: ResourceConfig[] = [
  introducingToolResouceConfig,
  getStartedResouceConfig,
];
