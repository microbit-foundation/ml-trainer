import { Button } from "@chakra-ui/react";
import { useCallback, useEffect } from "react";
import { FormattedMessage } from "react-intl";
import { useNavigate } from "react-router";
import BackArrow from "../components/BackArrow";
import DefaultPageLayout from "../components/DefaultPageLayout";
import ModelGridView from "../components/ModelGridView";
import { MlStage, useMlStatus } from "../ml-status-hooks";
import { SessionPageId } from "../pages-config";
import { createSessionPageUrl } from "../urls";

const ModelPage = () => {
  const navigate = useNavigate();
  const [{ stage }] = useMlStatus();

  const navigateToDataSamples = useCallback(() => {
    navigate(createSessionPageUrl(SessionPageId.DataSamples));
  }, [navigate]);

  useEffect(() => {
    if (stage !== MlStage.TrainingComplete) {
      navigateToDataSamples();
    }
  });
  return stage === MlStage.TrainingComplete ? (
    <DefaultPageLayout
      titleId={`${SessionPageId.TestingModel}-title`}
      showPageTitle
      toolbarItemsLeft={
        <Button
          size="lg"
          leftIcon={<BackArrow color="white" />}
          variant="plain"
          color="white"
          onClick={navigateToDataSamples}
          pr={3}
          pl={3}
        >
          <FormattedMessage id="back-to-data-samples-action" />
        </Button>
      }
    >
      <ModelGridView />
    </DefaultPageLayout>
  ) : (
    <></>
  );
};

export default ModelPage;
