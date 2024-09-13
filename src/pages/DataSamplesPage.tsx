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
} from "react-icons/ri";
import { FormattedMessage, useIntl } from "react-intl";
import { useNavigate } from "react-router";
import ConnectFirstView from "../components/ConnectFirstView";
import DataSampleGridView from "../components/DataSampleGridView";
import DefaultPageLayout from "../components/DefaultPageLayout";
import LiveGraphPanel from "../components/LiveGraphPanel";
import TrainingButton from "../components/TrainingButton";
import UploadDataSamplesMenuItem from "../components/UploadDataSamplesMenuItem";
import { ConnectionStatus } from "../connect-status-hooks";
import { useConnectionStage } from "../connection-stage-hooks";
import { SessionPageId } from "../pages-config";
import { useTrainModelDialog } from "../hooks/train-model-dialog-hooks";
import { createSessionPageUrl } from "../urls";
import SaveButton from "../components/SaveButton";
import {
  useAppStore,
  useHasSufficientDataForTrainig as useHasSufficientDataForTraining,
} from "../store";
import { MlStage } from "../model";

const DataSamplesPage = () => {
  const intl = useIntl();
  const gestures = useAppStore((s) => s.gestures);
  const addNewGesture = useAppStore((s) => s.addNewGesture);
  const downloadDataSet = useAppStore((s) => s.downloadDataset);
  const deleteAllGestures = useAppStore((s) => s.deleteAllGestures);
  const { stage } = useAppStore((s) => s.mlStatus);

  const navigate = useNavigate();
  const { onOpen: onOpenTrainModelDialog } = useTrainModelDialog();
  const { isConnected, status } = useConnectionStage();

  const hasSufficientData = useHasSufficientDataForTraining();
  const hasAnyRecordings = gestures.some((g) => g.recordings.length > 0);
  const isAddNewGestureDisabled =
    !isConnected || gestures.some((g) => g.name.length === 0);
  const showConnectFirstView =
    !hasAnyRecordings &&
    !isConnected &&
    status !== ConnectionStatus.ReconnectingAutomatically;

  const handleNavigateToModel = useCallback(() => {
    navigate(createSessionPageUrl(SessionPageId.TestingModel));
  }, [navigate]);

  return (
    <DefaultPageLayout
      titleId={`${SessionPageId.DataSamples}-title`}
      toolbarItemsRight={<SaveButton key="save" />}
      showPageTitle
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
                <UploadDataSamplesMenuItem />
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
          {stage === MlStage.TrainingComplete ? (
            <Button
              onClick={handleNavigateToModel}
              variant="primary"
              rightIcon={<RiArrowRightLine />}
            >
              <FormattedMessage id={`${SessionPageId.TestingModel}-title`} />
            </Button>
          ) : (
            <TrainingButton
              onClick={onOpenTrainModelDialog}
              variant={hasSufficientData ? "primary" : "secondary"}
            />
          )}
        </HStack>
        <LiveGraphPanel />
      </VStack>
    </DefaultPageLayout>
  );
};

export default DataSamplesPage;
