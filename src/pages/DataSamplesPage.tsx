import {
  Button,
  HStack,
  Icon,
  IconButton,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  VStack,
} from "@chakra-ui/react";
import { useCallback } from "react";
import { MdMoreVert } from "react-icons/md";
import {
  RiAddLine,
  RiArrowRightLine,
  RiDeleteBin2Line,
  RiDownload2Line,
  RiUpload2Line,
} from "react-icons/ri";
import { FormattedMessage, useIntl } from "react-intl";
import { useNavigate } from "react-router";
import ConnectFirstView from "../components/ConnectFirstView";
import DataSampleGridView from "../components/DataSampleGridView";
import DefaultPageLayout from "../components/DefaultPageLayout";
import LiveGraphPanel from "../components/LiveGraphPanel";
import LoadProjectMenuItem from "../components/LoadProjectMenuItem";
import { ConnectionStatus } from "../connect-status-hooks";
import { useConnectionStage } from "../connection-stage-hooks";
import { SessionPageId } from "../pages-config";
import { useHasSufficientDataForTraining, useStore } from "../store";
import { createSessionPageUrl } from "../urls";
import { TourId } from "../model";

const DataSamplesPage = () => {
  const intl = useIntl();
  const gestures = useStore((s) => s.gestures);
  const addNewGesture = useStore((s) => s.addNewGesture);
  const downloadDataSet = useStore((s) => s.downloadDataset);
  const deleteAllGestures = useStore((s) => s.deleteAllGestures);
  const model = useStore((s) => s.model);

  const navigate = useNavigate();
  const trainModelFlowStart = useStore((s) => s.trainModelFlowStart);
  const { isConnected, status } = useConnectionStage();

  const hasSufficientData = useHasSufficientDataForTraining();
  const hasAnyRecordings = gestures.some((g) => g.recordings.length > 0);
  const isAddNewGestureDisabled =
    !isConnected || gestures.some((g) => g.name.length === 0);
  const showConnectFirstView =
    !hasAnyRecordings &&
    !isConnected &&
    status !== ConnectionStatus.ReconnectingAutomatically;

  const tourStart = useStore((s) => s.tourStart);
  const handleNavigateToModel = useCallback(() => {
    navigate(createSessionPageUrl(SessionPageId.TestingModel));
    tourStart(TourId.TestModelPage);
  }, [navigate, tourStart]);

  return (
    <DefaultPageLayout
      titleId={`${SessionPageId.DataSamples}-title`}
      showPageTitle
      showHomeButton
      showSaveButton
    >
      <VStack flexGrow={1} id="data-samples-table">
        {showConnectFirstView ? <ConnectFirstView /> : <DataSampleGridView />}
      </VStack>
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
              // ID for spotlighting component in guided tour.
              id="add-action"
              variant={hasSufficientData ? "secondary" : "primary"}
              leftIcon={<RiAddLine />}
              onClick={addNewGesture}
              isDisabled={isAddNewGestureDisabled}
            >
              <FormattedMessage id="content.data.addAction" />
            </Button>
            <Menu>
              <MenuButton
                as={IconButton}
                aria-label={intl.formatMessage({
                  id: "content.data.controlbar.button.menu",
                })}
                variant="ghost"
                icon={<Icon as={MdMoreVert} boxSize={10} color="brand.500" />}
                isRound
              />
              <MenuList>
                <LoadProjectMenuItem icon={<RiUpload2Line />} accept=".json">
                  <FormattedMessage id="content.data.controlbar.button.uploadData" />
                </LoadProjectMenuItem>
                <MenuItem icon={<RiDownload2Line />} onClick={downloadDataSet}>
                  <FormattedMessage id="content.data.controlbar.button.downloadData" />
                </MenuItem>
                <MenuItem
                  icon={<RiDeleteBin2Line />}
                  onClick={deleteAllGestures}
                >
                  <FormattedMessage id="content.data.controlbar.button.clearData" />
                </MenuItem>
              </MenuList>
            </Menu>
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
              // ID for spotlighting component in guided tour.
              id="train-model"
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
