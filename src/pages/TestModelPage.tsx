import DefaultPageLayout from "../components/DefaultPageLayout";
import LiveGraphPanel from "../components/LiveGraphPanel";
import TabView from "../components/TabView";
import TestModelGridView from "../components/TestModelGridView";
import TrainModelFirstView from "../components/TrainModelFirstView";
import { testModelConfig } from "../pages-config";
import { MlStage, useMlStatus } from "../ml-status-hooks";

const TestModelPage = () => {
  const [{ stage }] = useMlStatus();

  return (
    <DefaultPageLayout titleId={`${testModelConfig.id}-title`}>
      <TabView activeStep={testModelConfig.id} />
      {stage === MlStage.TrainingComplete ? (
        <>
          <TestModelGridView />
          <LiveGraphPanel />
        </>
      ) : (
        <TrainModelFirstView />
      )}
    </DefaultPageLayout>
  );
};

export default TestModelPage;
