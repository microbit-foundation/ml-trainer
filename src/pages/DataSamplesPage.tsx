import { Button, HStack, VStack } from "@chakra-ui/react";
import { useCallback, useRef, useState } from "react";
import { RiAddLine, RiArrowRightLine } from "react-icons/ri";
import { FormattedMessage } from "react-intl";
import { useNavigate } from "react-router";
import DataSampleGridView from "../components/DataSamplesTable";
import DefaultPageLayout, {
  ProjectMenuItems,
  ProjectToolbarItems,
} from "../components/DefaultPageLayout";
import LiveGraphPanel from "../components/LiveGraphPanel";
import TrainModelDialogs from "../components/TrainModelFlowDialogs";
import { useHasSufficientDataForTraining, useStore } from "../store";
import { tourElClassname } from "../tours";
import { createTestingModelPageUrl } from "../urls";

const DataSamplesPage = () => {
  const gestures = useStore((s) => s.gestures);
  const addNewGesture = useStore((s) => s.addNewGesture);
  const model = useStore((s) => s.model);
  const [selectedGestureIdx, setSelectedGestureIdx] = useState<number>(0);

  const navigate = useNavigate();
  const trainModelFlowStart = useStore((s) => s.trainModelFlowStart);

  const hasSufficientData = useHasSufficientDataForTraining();
  const isAddNewGestureDisabled = gestures.some((g) => g.name.length === 0);

  const handleNavigateToModel = useCallback(() => {
    navigate(createTestingModelPageUrl());
  }, [navigate]);

  const trainButtonRef = useRef(null);
  const handleAddNewGesture = useCallback(() => {
    setSelectedGestureIdx(gestures.length);
    addNewGesture();
  }, [addNewGesture, gestures]);

  return (
    <>
      <TrainModelDialogs finalFocusRef={trainButtonRef} />
      <DefaultPageLayout
        titleId="data-samples-title"
        showPageTitle
        menuItems={<ProjectMenuItems />}
        toolbarItemsRight={<ProjectToolbarItems />}
      >
        <DataSampleGridView
          selectedGestureIdx={selectedGestureIdx}
          setSelectedGestureIdx={setSelectedGestureIdx}
        />
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
                onClick={handleAddNewGesture}
                isDisabled={isAddNewGestureDisabled}
              >
                <FormattedMessage id="add-action-action" />
              </Button>
            </HStack>
            {model ? (
              <Button
                onClick={handleNavigateToModel}
                variant="primary"
                rightIcon={<RiArrowRightLine />}
              >
                <FormattedMessage id="testing-model-title" />
              </Button>
            ) : (
              <Button
                ref={trainButtonRef}
                className={tourElClassname.trainModelButton}
                onClick={() => trainModelFlowStart(handleNavigateToModel)}
                variant={hasSufficientData ? "primary" : "secondary-disabled"}
              >
                <FormattedMessage id={"train-model"} />
              </Button>
            )}
          </HStack>
          <LiveGraphPanel disconnectedTextId="connect-to-record" />
        </VStack>
      </DefaultPageLayout>
    </>
  );
};

export default DataSamplesPage;
