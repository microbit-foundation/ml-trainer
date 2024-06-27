import addDataImage from "./images/add_data.svg";
import testModelImage from "./images/test_model_blue.svg";
import trainModelImage from "./images/train_model_blue.svg";
import AddDataPage from "./pages/AddDataPage";
import TestDataPage from "./pages/TestDataPage";
import TrainDataPage from "./pages/TrainDataPage";

export type StepId = "add-data" | "train-model" | "test-model";

export interface StepConfig {
  id: StepId;
  imgSrc: string;
  pageElement: () => JSX.Element;
}

export const addDataConfig: StepConfig = {
  id: "add-data",
  imgSrc: addDataImage,
  pageElement: AddDataPage,
};

export const trainDataConfig: StepConfig = {
  id: "train-model",
  imgSrc: trainModelImage,
  pageElement: TrainDataPage,
};

export const testDataConfig: StepConfig = {
  id: "test-model",
  imgSrc: testModelImage,
  pageElement: TestDataPage,
};

export const stepsConfig: StepConfig[] = [
  addDataConfig,
  trainDataConfig,
  testDataConfig,
];
