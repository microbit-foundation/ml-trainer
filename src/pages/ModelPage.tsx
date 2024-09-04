import DefaultPageLayout from "../components/DefaultPageLayout";
import TestModelGridView from "../components/TestModelGridView";
import TrainModelFirstView from "../components/TrainModelFirstView";
import { MlStage, useMlStatus } from "../ml-status-hooks";
import { testModelConfig } from "../pages-config";

const TestModelPage = () => {
  const [{ stage }] = useMlStatus();
  return (
    <DefaultPageLayout titleId={`${testModelConfig.id}-title`}>
      {stage === MlStage.TrainingComplete ? (
        <TestModelGridView />
      ) : (
        <TrainModelFirstView />
      )}
    </DefaultPageLayout>
  );
};

export default TestModelPage;
