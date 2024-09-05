import { Button } from "@chakra-ui/react";
import { useCallback } from "react";
import { FormattedMessage } from "react-intl";
import { useNavigate } from "react-router";
import BackArrow from "../components/BackArrow";
import DefaultPageLayout from "../components/DefaultPageLayout";
import ModelGridView from "../components/ModelGridView";
import TrainModelFirstView from "../components/TrainModelFirstView";
import { MlStage, useMlStatus } from "../ml-status-hooks";
import { SessionPageId } from "../pages-config";
import { createSessionPageUrl } from "../urls";

const ModelPage = () => {
  const navigate = useNavigate();
  const [{ stage }] = useMlStatus();
  const handleOnBack = useCallback(() => {
    navigate(createSessionPageUrl(SessionPageId.DataSamples));
  }, [navigate]);
  return (
    <DefaultPageLayout
      titleId={`${SessionPageId.Model}-title`}
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

export default ModelPage;
