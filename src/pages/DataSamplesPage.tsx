/**
 * (c) 2023, Center for Computational Thinking and Design at Aarhus University and contributors
 * Modifications (c) 2024, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { Button, Flex, HStack, useDisclosure, VStack } from "@chakra-ui/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { RiAddLine, RiArrowRightLine } from "react-icons/ri";
import { FormattedMessage, IntlFormatters, useIntl } from "react-intl";
import { useNavigate } from "react-router";
import { useHasMoved } from "../buffered-data-hooks";
import DataSamplesTable from "../components/DataSamplesTable";
import {
  AddActionHint,
  MoveMicrobitHint,
  TrainHint,
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
import {
  ActionData,
  DataSamplesPageHint,
  PostImportDialogState,
} from "../model";
import { useHasSufficientDataForTraining, useStore } from "../store";
import { tourElClassname } from "../tours";
import { createTestingModelPageUrl } from "../urls";
import { animations } from "../components/Emoji";
import { useLiveRegion } from "../live-region-hook";
import debounce from "lodash.debounce";

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
    defaultIsOpen: !isConnected && !model,
  });
  const hasMoved = useHasMoved();
  const tourInProgress = useStore((s) => !!s.tourState);
  const isRecordingDialogOpen = useStore((s) => !!s.isRecordingDialogOpen);
  const isPostImportDialogOpen = useStore(
    (s) => s.postImportDialogState !== PostImportDialogState.None
  );
  const isDialogOpen =
    welcomeDialogDisclosure.isOpen ||
    isConnectionDialogOpen ||
    tourInProgress ||
    isRecordingDialogOpen ||
    isPostImportDialogOpen;
  const hint = useStore((s) => s.hint);
  const setHint = useStore((s) => s.setHint);
  useEffect(() => {
    setHint(false);
  }, [setHint]);
  const dataSamplesHint: DataSamplesPageHint = isDialogOpen
    ? null
    : activeHintForActions(hint, isConnected, hasMoved);

  const pageRef = useRef(null);
  const region = useLiveRegion(pageRef.current);

  // To avoid aria-live interruptions, particularly when inputting action name.
  const debouncedSpeakHint = useMemo(
    () =>
      debounce(
        (hintText: string) => {
          region.speak(hintText);
        },
        1000,
        { leading: false, trailing: true }
      ),
    [region]
  );

  useEffect(() => {
    if (!dataSamplesHint) {
      return;
    }
    const actionWithHint = actions[actions.length - 1];
    const hintText = getHintText(
      intl,
      dataSamplesHint,
      isConnected,
      actionWithHint
    );
    debouncedSpeakHint(hintText);
  }, [actions, dataSamplesHint, debouncedSpeakHint, intl, isConnected, region]);

  return (
    <>
      {welcomeDialogDisclosure.isOpen && !isPostImportDialogOpen && (
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
        <Flex as="main" flexGrow={1} flexDir="column" ref={pageRef}>
          <DataSamplesTable
            selectedActionIdx={selectedActionIdx}
            setSelectedActionIdx={setSelectedActionIdx}
            hint={dataSamplesHint}
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
            {dataSamplesHint === "add-action" && (
              <AddActionHint action={actions[0]} />
            )}
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
            {dataSamplesHint === "train" && <TrainHint />}
            {dataSamplesHint === "move-microbit" && <MoveMicrobitHint />}
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

const getHintText = (
  intl: IntlFormatters,
  hint: DataSamplesPageHint,
  isConnected: boolean,
  action: ActionData
): string => {
  if (!hint) {
    return "";
  }
  switch (hint) {
    case "add-action": {
      return intl.formatMessage(
        { id: "add-action-hint-label" },
        { actionName: action.name }
      );
    }
    case "move-microbit": {
      return intl.formatMessage({ id: "move-hint" });
    }
    case "record-first-action":
    case "record-action": {
      return isConnected
        ? intl
            .formatMessage(
              { id: "record-hint-button-b" },
              { mark: (chunks: string[]) => chunks }
            )
            .toString()
        : intl.formatMessage({ id: "record-hint" });
    }
    case "name-first-action":
    case "name-action-with-samples":
    case "name-action": {
      return intl.formatMessage({ id: "name-action-hint" });
    }
    case "record-more-action": {
      return intl.formatMessage(
        { id: "record-more-hint-label" },
        {
          numSamples: action.recordings.length === 1 ? 2 : 1,
          actionName: action.name,
        }
      );
    }
    case "train": {
      return intl.formatMessage({ id: "train-hint-label" });
    }
  }
};

const activeHintForActions = (
  hint: DataSamplesPageHint,
  isConnected: boolean,
  hasMoved: boolean
): DataSamplesPageHint => {
  if (isConnected && !hasMoved) {
    return "move-microbit";
  }
  return hint;
};

export default DataSamplesPage;
