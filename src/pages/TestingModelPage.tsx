import { Button } from "@chakra-ui/react";
import { useCallback, useEffect } from "react";
import { FormattedMessage } from "react-intl";
import { useNavigate } from "react-router";
import BackArrow from "../components/BackArrow";
import DefaultPageLayout from "../components/DefaultPageLayout";
import TestingModelGridView from "../components/TestingModelGridView";
import { SessionPageId } from "../pages-config";
import { createSessionPageUrl } from "../urls";
import SaveButton from "../components/SaveButton";
import { useAppStore } from "../store";

const TestingModelPage = () => {
  const navigate = useNavigate();
  const model = useAppStore((s) => s.model);

  const navigateToDataSamples = useCallback(() => {
    navigate(createSessionPageUrl(SessionPageId.DataSamples));
  }, [navigate]);

  useEffect(() => {
    if (!model) {
      navigateToDataSamples();
    }
  }, [model, navigateToDataSamples]);

  return model ? (
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
      toolbarItemsRight={<SaveButton />}
    >
      <TestingModelGridView />
    </DefaultPageLayout>
  ) : (
    <></>
  );
};

export default TestingModelPage;
