import { Button, HStack, VStack } from "@chakra-ui/react";
import { useCallback, useRef, useState } from "react";
import { RiAddLine, RiArrowRightLine } from "react-icons/ri";
import { FormattedMessage } from "react-intl";
import { useNavigate } from "react-router";
import DataSamplesTable from "../components/DataSamplesTable";
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
  const actions = useStore((s) => s.actions);
  const addNewAction = useStore((s) => s.addNewAction);
  const model = useStore((s) => s.model);
  const [selectedActionIdx, setSelectedActionIdx] = useState<number>(0);

  const navigate = useNavigate();
  const trainModelFlowStart = useStore((s) => s.trainModelFlowStart);

  const hasSufficientData = useHasSufficientDataForTraining();
  const isAddNewActionDisabled = actions.some((a) => a.name.length === 0);

  const handleNavigateToModel = useCallback(() => {
    navigate(createTestingModelPageUrl());
  }, [navigate]);

  const trainButtonRef = useRef(null);
  const handleAddNewAction = useCallback(() => {
    setSelectedActionIdx(actions.length);
    addNewAction();
  }, [addNewAction, actions]);

  return (
    <>
      <TrainModelDialogs finalFocusRef={trainButtonRef} />
      <DefaultPageLayout
        titleId="data-samples-title"
        showPageTitle
        menuItems={<ProjectMenuItems />}
        toolbarItemsRight={<ProjectToolbarItems />}
      >
        <DataSamplesTable
          selectedActionIdx={selectedActionIdx}
          setSelectedActionIdx={setSelectedActionIdx}
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
                onClick={handleAddNewAction}
                isDisabled={isAddNewActionDisabled}
              >
                <FormattedMessage id="add-action-action" />
              </Button>
            </HStack>
            <HStack>
              {model ? (
                <Button
                  onClick={handleNavigateToModel}
                  className={tourElClassname.trainModelButton}
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
                  <FormattedMessage id="train-model" />
                </Button>
              )}
            </HStack>
          </HStack>
          <LiveGraphPanel disconnectedTextId="connect-to-record" />
        </VStack>
      </DefaultPageLayout>
    </>
  );
};

export default DataSamplesPage;
