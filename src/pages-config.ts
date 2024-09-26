import DataSamplesPage from "./pages/DataSamplesPage";
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
