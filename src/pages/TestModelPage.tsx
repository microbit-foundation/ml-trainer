import DefaultPageLayout from "../components/DefaultPageLayout";
import LiveGraphPanel from "../components/LiveGraphPanel";
import TabView from "../components/TabView";
import TestModelGridView from "../components/TestModelGridView";
import TrainModelFirstView from "../components/TrainModelFirstView";
import { useGestures } from "../hooks/use-gestures";
import { getPredictedGesture, usePrediction } from "../hooks/use-ml-actions";
import { MlStage, useMlStatus } from "../hooks/use-ml-status";
import { testModelConfig } from "../pages-config";

const TestModelPage = () => {
  const [{ stage }] = useMlStatus();
  const confidences = usePrediction();
  const [gestures] = useGestures();
  const predictedGesture = getPredictedGesture(gestures, confidences);
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
