/**
 * (c) 2023, Center for Computational Thinking and Design at Aarhus University and contributors
 * Modifications (c) 2024, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { Button, Flex, HStack, useDisclosure, VStack } from "@chakra-ui/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { RiAddLine, RiArrowRightLine } from "react-icons/ri";
import { FormattedMessage, useIntl } from "react-intl";
import { useNavigate } from "react-router";
import { useHasMoved } from "../buffered-data-hooks";
import DataSamplesTable from "../components/DataSamplesTable";
import {
  AddActionHint,
  MoveMicrobitHint,
} from "../components/DataSamplesTableHints";
import DefaultPageLayout, {
  ProjectMenuItems,
  ProjectToolbarItems,
} from "../components/DefaultPageLayout";
import LiveGraphPanel from "../components/LiveGraphPanel";
import TrainModelDialogs from "../components/TrainModelFlowDialogs";
import WelcomeDialog from "../components/WelcomeDialog";
import { useConnectionStage } from "../connection-stage-hooks";
import { keyboardShortcuts, useShortcut } from "../keyboard-shortcut-hooks";
import { ActionData, DataSamplesPageHint } from "../model";
import { useHasSufficientDataForTraining, useStore } from "../store";
import { tourElClassname } from "../tours";
import { createTestingModelPageUrl } from "../urls";
import { animations } from "../components/Emoji";

const DataSamplesPage = () => {
  const actions = useStore((s) => s.actions);
  const addNewAction = useStore((s) => s.addNewAction);
  const model = useStore((s) => s.model);
  const [selectedActionIdx, setSelectedActionIdx] = useState<number>(0);

  const navigate = useNavigate();
  const trainModelFlowStart = useStore((s) => s.trainModelFlowStart);

  const tourStart = useStore((s) => s.tourStart);
  const { isConnected, isDialogOpen: isConnectionDialogOpen } =
    useConnectionStage();
  useEffect(() => {
    // If a user first connects on "Testing model" this can result in the tour when they return to the "Data samples" page.
    if (isConnected) {
      tourStart({ name: "Connect" }, false);
    }
  }, [isConnected, tourStart]);

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
  useShortcut(keyboardShortcuts.addAction, handleAddNewAction, {
    enabled: !isAddNewActionDisabled,
  });
  const intl = useIntl();
  const welcomeDialogDisclosure = useDisclosure({
    defaultIsOpen: !isConnected,
  });
  const hasMoved = useHasMoved();
  const tourInProgress = useStore((s) => !!s.tourState);
  const isRecordingDialogOpen = useStore((s) => !!s.isRecordingDialogOpen);
  const isDialogOpen =
    welcomeDialogDisclosure.isOpen ||
    isConnectionDialogOpen ||
    tourInProgress ||
    isRecordingDialogOpen;
  const hint: DataSamplesPageHint = isDialogOpen
    ? null
    : activeHintForActions(actions, hasMoved, isConnected);

  return (
    <>
      {welcomeDialogDisclosure.isOpen && (
        <WelcomeDialog
          onClose={welcomeDialogDisclosure.onClose}
          isOpen={welcomeDialogDisclosure.isOpen}
        />
      )}
      <TrainModelDialogs finalFocusRef={trainButtonRef} />
      <DefaultPageLayout
        titleId="data-samples-title"
        showPageTitle
        menuItems={<ProjectMenuItems />}
        toolbarItemsRight={<ProjectToolbarItems />}
      >
        <Flex as="main" flexGrow={1} flexDir="column">
          <DataSamplesTable
            selectedActionIdx={selectedActionIdx}
            setSelectedActionIdx={setSelectedActionIdx}
            hint={hint}
          />
        </Flex>
        <VStack w="full" flexShrink={0} bottom={0} gap={0} bg="gray.25">
          <HStack
            role="region"
            aria-label={intl.formatMessage({
              id: "data-samples-actions-region",
            })}
            justifyContent="space-between"
            px={5}
            py={2}
            w="full"
            borderBottomWidth={3}
            borderTopWidth={3}
            borderColor="gray.200"
            alignItems="center"
            position="relative"
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
                  animation={
                    hasSufficientData && !isRecordingDialogOpen
                      ? animations.tada
                      : undefined
                  }
                >
                  <FormattedMessage id="train-model" />
                </Button>
              )}
            </HStack>
            {hint === "move-microbit" && <MoveMicrobitHint />}
            {hint === "add-action" && <AddActionHint action={actions[0]} />}
          </HStack>

          <LiveGraphPanel
            disconnectedTextId="connect-to-record"
            showDisconnectedOverlay={!isDialogOpen}
          />
        </VStack>
      </DefaultPageLayout>
    </>
  );
};

const activeHintForActions = (
  actions: ActionData[],
  isConnected: boolean,
  hasMoved: boolean
): DataSamplesPageHint => {
  if (isConnected && !hasMoved) {
    return "move-microbit";
  }

  // We don't let you have zero. If you have > 1 you've seen it all before.
  if (actions.length !== 1) {
    return null;
  }
  const action = actions[0];
  if (action.name.length === 0) {
    if (action.recordings.length === 0) {
      return "name-action";
    } else {
      // No space for hint with actions already recorded.
      return null;
    }
  }

  if (action.recordings.length === 0) {
    return "record";
  }
  if (action.recordings.length < 3) {
    return "record-more";
  }
  return "add-action";
};

export default DataSamplesPage;
