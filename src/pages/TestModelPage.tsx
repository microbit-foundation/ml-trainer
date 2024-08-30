import DefaultPageLayout from "../components/DefaultPageLayout";
import LiveGraphPanel from "../components/LiveGraphPanel";
import TabView from "../components/TabView";
import TestModelGridView from "../components/TestModelGridView";
import TrainModelFirstView from "../components/TrainModelFirstView";
import { usePrediction } from "../hooks/use-ml-actions";
import { MlStage, useMlStatus } from "../hooks/use-ml-status";
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
