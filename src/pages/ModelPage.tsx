import { Button } from "@chakra-ui/react";
import { useCallback } from "react";
import { FormattedMessage } from "react-intl";
import { useNavigate } from "react-router";
import BackArrow from "../components/BackArrow";
import DefaultPageLayout from "../components/DefaultPageLayout";
import ModelGridView from "../components/ModelGridView";
import TrainModelFirstView from "../components/TrainModelFirstView";
import { MlStage, useMlStatus } from "../ml-status-hooks";
import { TabId, testModelConfig } from "../pages-config";
import { createStepPageUrl } from "../urls";

const TestModelPage = () => {
  const navigate = useNavigate();
  const [{ stage }] = useMlStatus();
  const handleOnBack = useCallback(() => {
    navigate(createStepPageUrl(TabId.Data));
  }, [navigate]);
  return (
    <DefaultPageLayout
      titleId={`${testModelConfig.id}-title`}
      showPageTitle
      toolbarItemsLeft={
        <Button
          size="lg"
          leftIcon={<BackArrow color="white" />}
          variant="plain"
          color="white"
          onClick={handleOnBack}
          pr={3}
          pl={3}
        >
          <FormattedMessage id="back-action" />
        </Button>
      }
    >
      {stage === MlStage.TrainingComplete ? (
        <ModelGridView />
      ) : (
        <TrainModelFirstView />
      )}
    </DefaultPageLayout>
  );
};

export default TestModelPage;
