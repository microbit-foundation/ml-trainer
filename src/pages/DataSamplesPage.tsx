import { Button, HStack, VStack } from "@chakra-ui/react";
import { useCallback, useRef } from "react";
import { RiAddLine, RiArrowRightLine } from "react-icons/ri";
import { FormattedMessage } from "react-intl";
import { useNavigate } from "react-router";
import DataSampleGridView from "../components/DataSampleGridView";
import DefaultPageLayout, {
  ProjectMenuItems,
  ProjectToolbarItems,
} from "../components/DefaultPageLayout";
import LiveGraphPanel from "../components/LiveGraphPanel";
import { SessionPageId } from "../pages-config";
import { useHasSufficientDataForTraining, useStore } from "../store";
import { tourElClassname } from "../tours";
import { createSessionPageUrl } from "../urls";
import TrainModelDialogs from "../components/TrainModelFlowDialogs";

const DataSamplesPage = () => {
  const gestures = useStore((s) => s.gestures);
  const addNewGesture = useStore((s) => s.addNewGesture);
  const model = useStore((s) => s.model);

  const navigate = useNavigate();
  const trainModelFlowStart = useStore((s) => s.trainModelFlowStart);

  const hasSufficientData = useHasSufficientDataForTraining();
  const isAddNewGestureDisabled = gestures.some((g) => g.name.length === 0);

  const handleNavigateToModel = useCallback(() => {
    navigate(createSessionPageUrl(SessionPageId.TestingModel));
  }, [navigate]);

  const trainButtonRef = useRef(null);
  return (
    <>
      <TrainModelDialogs finalFocusRef={trainButtonRef} />
      <DefaultPageLayout
        titleId={`${SessionPageId.DataSamples}-title`}
        showPageTitle
        menuItems={<ProjectMenuItems />}
        toolbarItemsRight={<ProjectToolbarItems />}
      >
        <DataSampleGridView />
        <VStack w="full" flexShrink={0} bottom={0} gap={0} bg="gray.25">
          <HStack
            justifyContent="space-between"
            px={5}
            py={2}
            w="full"
            borderBottomWidth={3}
            borderTopWidth={3}
            borderColor="gray.200"
            alignItems="center"
          >
            <HStack gap={2} alignItems="center">
              <Button
                className={tourElClassname.addActionButton}
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
                ref={trainButtonRef}
                className={tourElClassname.trainModelButton}
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
    </>
  );
};

export default DataSamplesPage;
