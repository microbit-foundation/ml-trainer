import DefaultPageLayout from "../components/DefaultPageLayout";
import LiveGraphPanel from "../components/LiveGraphPanel";
import TabView from "../components/TabView";
import TestModelGridView from "../components/TestModelGridView";
import TrainModelFirstView from "../components/TrainModelFirstView";
import { usePrediction } from "../ml-hooks";
import { MlStage, useMlStatus } from "../ml-status-hooks";
import { testModelConfig } from "../pages-config";

const TestModelPage = () => {
  const [{ stage }] = useMlStatus();
  const prediction = usePrediction();
  return (
    <DefaultPageLayout titleId={`${testModelConfig.id}-title`}>
      <TabView activeStep={testModelConfig.id} />
      {stage === MlStage.TrainingComplete ? (
        <>
          <TestModelGridView prediction={prediction} />
          <LiveGraphPanel
            detected={prediction?.detected}
            showPredictedGesture
          />
        </>
      ) : (
        <TrainModelFirstView />
      )}
    </DefaultPageLayout>
  );
};

export default TestModelPage;
