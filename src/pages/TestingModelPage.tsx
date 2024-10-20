import { Button } from "@chakra-ui/react";
import { useCallback, useEffect } from "react";
import { FormattedMessage } from "react-intl";
import { useNavigate } from "react-router";
import BackArrow from "../components/BackArrow";
import DefaultPageLayout, {
  ProjectMenuItems,
  ProjectToolbarItems,
} from "../components/DefaultPageLayout";
import TestingModelGridView from "../components/TestingModelGridView";
import { useStore } from "../store";
import { createDataSamplesPageUrl } from "../urls";

const TestingModelPage = () => {
  const navigate = useNavigate();
  const model = useStore((s) => s.model);

  const navigateToDataSamples = useCallback(() => {
    navigate(createDataSamplesPageUrl());
  }, [navigate]);

  useEffect(() => {
    if (!model) {
      navigateToDataSamples();
    }
  }, [model, navigateToDataSamples]);

  return model ? (
    <DefaultPageLayout
      titleId="testing-model-title"
      showPageTitle
      menuItems={<ProjectMenuItems />}
      toolbarItemsRight={<ProjectToolbarItems />}
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
      <TestingModelGridView />
    </DefaultPageLayout>
  ) : (
    <></>
  );
};

export default TestingModelPage;
