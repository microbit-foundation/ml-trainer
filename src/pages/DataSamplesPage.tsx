/**
 * (c) 2023, Center for Computational Thinking and Design at Aarhus University and contributors
 * Modifications (c) 2024, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import {
  AspectRatio,
  Button,
  Flex,
  HStack,
  Image,
  Text,
  useDisclosure,
  VStack,
} from "@chakra-ui/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { RiAddLine, RiArrowRightLine } from "react-icons/ri";
import { FormattedMessage, useIntl } from "react-intl";
import { useNavigate } from "react-router";
import { useHasMoved } from "../buffered-data-hooks";
import DataSamplesTable from "../components/DataSamplesTable";
import DefaultPageLayout, {
  ProjectMenuItems,
  ProjectToolbarItems,
} from "../components/DefaultPageLayout";
import EmojiArrow from "../components/EmojiArrow";
import LiveGraphPanel from "../components/LiveGraphPanel";
import TrainModelDialogs from "../components/TrainModelFlowDialogs";
import WelcomeDialog from "../components/WelcomeDialog";
import { useConnectionStage } from "../connection-stage-hooks";
import { keyboardShortcuts, useShortcut } from "../keyboard-shortcut-hooks";
import { useHasSufficientDataForTraining, useStore } from "../store";
import { tourElClassname } from "../tours";
import { createTestingModelPageUrl } from "../urls";
import moveMicrobitImage from "../images/move-microbit.svg";
import { animate } from "framer-motion";
import { animations } from "../components/Emoji";

type ActiveHint = null | "graph" | "table";

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
  const isDialogOpen =
    welcomeDialogDisclosure.isOpen || isConnectionDialogOpen || tourInProgress;
  const activeHint: ActiveHint = isDialogOpen
    ? null
    : isConnected && !hasMoved
    ? "graph"
    : "table";

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
            showHints={activeHint === "table"}
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
                  variant="primary"
                >
                  <FormattedMessage id="train-model" />
                </Button>
              )}
            </HStack>
            {activeHint === "graph" && (
              <HStack
                m={0}
                position="absolute"
                right={16}
                bottom={12}
                spacing={0}
              >
                <EmojiArrow
                  mt={8}
                  transform="rotate(-80deg)"
                  transformOrigin="center"
                  color="brand.500"
                />
                <AspectRatio
                  ratio={30 / 25}
                  w={36}
                  animation={animations.wobble}
                >
                  <Image src={moveMicrobitImage} />
                </AspectRatio>
                <Text textAlign="center" w={48}>
                  Shake the micro:bit and watch the graph change
                </Text>
              </HStack>
            )}
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

export default DataSamplesPage;
