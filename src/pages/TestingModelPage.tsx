import { Button } from "@chakra-ui/react";
import { useCallback, useEffect, useState } from "react";
import { FormattedMessage } from "react-intl";
import { useNavigate } from "react-router";
import BackArrow from "../components/BackArrow";
import DefaultPageLayout from "../components/DefaultPageLayout";
import TestingModelDialog from "../components/TestingModelDialog";
import TestingModelGridView from "../components/TestingModelGridView";
import { MlStage, useMlStatus } from "../ml-status-hooks";
import { SessionPageId } from "../pages-config";
import { useSettings } from "../settings";
import { createSessionPageUrl } from "../urls";

const TestingModelPage = () => {
  const navigate = useNavigate();
  const [{ stage }] = useMlStatus();

  const navigateToDataSamples = useCallback(() => {
    navigate(createSessionPageUrl(SessionPageId.DataSamples));
  }, [navigate]);

  const [{ showTestModelHelp }] = useSettings();
  // Don't use useDisclosure otherwise the dialog launches after the page
  // is shown. Using state means the dialog is shown immediately.
  const [showHelpDialog, setShowHelpDialog] = useState(showTestModelHelp);

  useEffect(() => {
    if (stage !== MlStage.TrainingComplete) {
      navigateToDataSamples();
    }
  }, [navigateToDataSamples, stage]);

  const onHelpDialogClose = useCallback(() => {
    setShowHelpDialog(false);
  }, []);

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
      <TestingModelDialog isOpen={showHelpDialog} onClose={onHelpDialogClose} />
      <TestingModelGridView />
    </DefaultPageLayout>
  ) : (
    <></>
  );
};

export default TestingModelPage;
