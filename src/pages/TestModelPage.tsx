import DefaultPageLayout from "../components/DefaultPageLayout";
import LiveGraphPanel from "../components/LiveGraphPanel";
import TabView from "../components/TabView";
import TestModelGridView from "../components/TestModelGridView";
import TrainModelFirstView from "../components/TrainModelFirstView";
import { testModelConfig } from "../pages-config";
import { MlStage, useMlStatus } from "../ml-status-hooks";
import { getPredictedGesture, usePrediction } from "../ml-hooks";
import { useGestureData } from "../gestures-hooks";

const TestModelPage = () => {
  const [{ stage }] = useMlStatus();
  const confidences = usePrediction();
  const [gestureData] = useGestureData();
  const predictedGesture = getPredictedGesture(gestureData, confidences);
  return (
    <DefaultPageLayout titleId={`${testModelConfig.id}-title`}>
      <TabView activeStep={testModelConfig.id} />
      {stage === MlStage.TrainingComplete ? (
        <>
          <TestModelGridView
            confidences={confidences}
            predictedGesture={predictedGesture}
          />
          <LiveGraphPanel
            predictedGesture={predictedGesture}
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
