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
import { useCallback, useMemo } from "react";
import { MdMoreVert } from "react-icons/md";
import { RiAddLine, RiDeleteBin2Line, RiDownload2Line } from "react-icons/ri";
import { FormattedMessage, useIntl } from "react-intl";
import { useNavigate } from "react-router";
import AddDataGridView from "../components/AddDataGridView";
import ConnectFirstView from "../components/ConnectFirstView";
import DefaultPageLayout from "../components/DefaultPageLayout";
import LiveGraphPanel from "../components/LiveGraphPanel";
import TabView from "../components/TabView";
import TrainingButton from "../components/TrainingButton";
import UploadDataSamplesMenuItem from "../components/UploadDataSamplesMenuItem";
import {
  hasSufficientDataForTraining,
  useGestureActions,
  useGestureData,
} from "../gestures-hooks";
import { addDataConfig } from "../pages-config";
import { createStepPageUrl } from "../urls";

const AddDataPage = () => {
  const intl = useIntl();
  const navigate = useNavigate();
  const [gestures] = useGestureData();
  const actions = useGestureActions();
  const isInputConnected = true;

  const hasSufficientData = useMemo(
    () => hasSufficientDataForTraining(gestures.data),
    [gestures.data]
  );

  const noStoredData = useMemo<boolean>(() => {
    const gestureData = gestures.data;
    return (
      gestureData.length !== 0 &&
      gestureData.some((g) => g.recordings.length > 0)
    );
  }, [gestures.data]);

  const handleAddNewGesture = useCallback(() => {
    actions.addNewGesture();
  }, [actions]);

  const handleDatasetDownload = useCallback(() => {
    actions.downloadDataset();
  }, [actions]);

  const navigateToTrainModelPage = useCallback(() => {
    navigate(createStepPageUrl("train-model"));
  }, [navigate]);

  return (
    <DefaultPageLayout titleId={`${addDataConfig.id}-title`}>
      <TabView activeStep={addDataConfig.id} />
      {noStoredData && !isInputConnected ? (
        <ConnectFirstView />
      ) : (
        <AddDataGridView />
      )}
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
          <Button
            variant={hasSufficientData ? "secondary" : "primary"}
            leftIcon={<RiAddLine />}
            onClick={handleAddNewGesture}
            isDisabled={
              !isInputConnected ||
              gestures.data.some((g) => g.name.length === 0)
            }
          >
            <FormattedMessage id="content.data.addAction" />
          </Button>
          <HStack gap={2} alignItems="center">
            <TrainingButton
              onClick={navigateToTrainModelPage}
              variant={hasSufficientData ? "primary" : "secondary"}
            />
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
                <MenuItem
                  icon={<RiDownload2Line />}
                  onClick={handleDatasetDownload}
                >
                  <FormattedMessage id="content.data.controlbar.button.downloadData" />
                </MenuItem>
                <MenuItem
                  icon={<RiDeleteBin2Line />}
                  onClick={actions.deleteAllGestures}
                >
                  <FormattedMessage id="content.data.controlbar.button.clearData" />
                </MenuItem>
              </MenuList>
            </Menu>
          </HStack>
        </HStack>
        <LiveGraphPanel />
      </VStack>
    </DefaultPageLayout>
  );
};

export default AddDataPage;
