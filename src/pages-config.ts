import resourceGetStartedImage from "./images/resource-get-started.jpg";
import resourceIntroducingToolImage from "./images/resource-introducing-tool.jpg";
import DataSamplesPage from "./pages/DataSamplesPage";
import GetStartedResourcePage from "./pages/GetStartedResourcePage";
import IntroducingToolResourcePage from "./pages/IntroducingToolResourcePage";
import ModelPage from "./pages/ModelPage";

export enum TabId {
  Data = "data-samples",
  Model = "model",
}

export interface TabConfig {
  id: TabId;
  pageElement: () => JSX.Element;
}

export const addDataConfig: TabConfig = {
  id: TabId.Data,
  pageElement: DataSamplesPage,
};

export const testModelConfig: TabConfig = {
  id: TabId.Model,
  pageElement: ModelPage,
};

export const tabConfigs: TabConfig[] = [
  {
    id: TabId.Data,
    pageElement: DataSamplesPage,
  },
  {
    id: TabId.Model,
    pageElement: ModelPage,
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
