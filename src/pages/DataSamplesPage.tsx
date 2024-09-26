import { Button, HStack, VStack } from "@chakra-ui/react";
import { useCallback } from "react";
import { RiAddLine, RiArrowRightLine } from "react-icons/ri";
import { FormattedMessage } from "react-intl";
import { useNavigate } from "react-router";
import ConnectFirstView from "../components/ConnectFirstView";
import DataSampleGridView from "../components/DataSampleGridView";
import DefaultPageLayout from "../components/DefaultPageLayout";
import LiveGraphPanel from "../components/LiveGraphPanel";
import { ConnectionStatus } from "../connect-status-hooks";
import { useConnectionStage } from "../connection-stage-hooks";
import { SessionPageId } from "../pages-config";
import { useHasSufficientDataForTraining, useStore } from "../store";
import { createSessionPageUrl } from "../urls";

const DataSamplesPage = () => {
  const gestures = useStore((s) => s.gestures);
  const addNewGesture = useStore((s) => s.addNewGesture);
  const model = useStore((s) => s.model);

  const navigate = useNavigate();
  const trainModelFlowStart = useStore((s) => s.trainModelFlowStart);
  const { isConnected, status } = useConnectionStage();

  const hasSufficientData = useHasSufficientDataForTraining();
  const isAddNewGestureDisabled =
    !isConnected || gestures.some((g) => g.name.length === 0);

  const hasNoData =
    gestures.length === 1 &&
    gestures[0].name.length === 0 &&
    gestures[0].recordings.length === 0;

  const showConnectFirstView =
    hasNoData &&
    !isConnected &&
    status !== ConnectionStatus.ReconnectingAutomatically;

  const handleNavigateToModel = useCallback(() => {
    navigate(createSessionPageUrl(SessionPageId.TestingModel));
  }, [navigate]);

  return (
    <DefaultPageLayout
      titleId={`${SessionPageId.DataSamples}-title`}
      showPageTitle
      showHomeButton
      showSaveButton
    >
      {showConnectFirstView ? <ConnectFirstView /> : <DataSampleGridView />}
      <VStack w="full" flexShrink={0} bottom={0} gap={0} bg="gray.25">
        <HStack
          justifyContent="space-between"
          px={10}
          py={2}
          w="full"
          borderBottomWidth={3}
          borderTopWidth={3}
          borderColor="gray.200"
          alignItems="center"
        >
          <HStack gap={2} alignItems="center">
            <Button
              variant={hasSufficientData ? "secondary" : "primary"}
              leftIcon={<RiAddLine />}
              onClick={addNewGesture}
              isDisabled={isAddNewGestureDisabled}
            >
              <FormattedMessage id="content.data.addAction" />
            </Button>
          </HStack>
          {model ? (
            <Button
              onClick={handleNavigateToModel}
              variant="primary"
              rightIcon={<RiArrowRightLine />}
            >
              <FormattedMessage id={`${SessionPageId.TestingModel}-title`} />
            </Button>
          ) : (
            <Button
              onClick={trainModelFlowStart}
              variant={hasSufficientData ? "primary" : "secondary-disabled"}
            >
              <FormattedMessage id={"menu.trainer.trainModelButton"} />
            </Button>
          )}
        </HStack>
        <LiveGraphPanel />
      </VStack>
    </DefaultPageLayout>
  );
};

export default DataSamplesPage;
