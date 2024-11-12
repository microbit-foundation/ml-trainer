import {
  Button,
  ButtonGroup,
  HStack,
  Menu,
  MenuItem,
  MenuList,
  Portal,
  useDisclosure,
  VStack,
} from "@chakra-ui/react";
import { useCallback, useEffect, useState } from "react";
import { RiDeleteBin2Line } from "react-icons/ri";
import { FormattedMessage, useIntl } from "react-intl";
import { useNavigate } from "react-router";
import BackArrow from "../components/BackArrow";
import DefaultPageLayout, {
  ProjectMenuItems,
  ProjectToolbarItems,
} from "../components/DefaultPageLayout";
import IncompatibleEditorDevice from "../components/IncompatibleEditorDevice";
import LiveGraphPanel from "../components/LiveGraphPanel";
import MoreMenuButton from "../components/MoreMenuButton";
import TestingModelTable from "../components/TestingModelTable";
import { useConnectActions } from "../connect-actions-hooks";
import { useProject } from "../hooks/project-hooks";
import { useStore } from "../store";
import { tourElClassname } from "../tours";
import { createDataSamplesPageUrl } from "../urls";
import { useBufferedData } from "../buffered-data-hooks";

const TestingModelPage = () => {
  const navigate = useNavigate();
  const model = useStore((s) => s.model);
  const startPredicting = useStore((s) => s.startPredicting);
  const stopPredicting = useStore((s) => s.stopPredicting);
  const bufferedData = useBufferedData();
  const intl = useIntl();

  const navigateToDataSamples = useCallback(() => {
    navigate(createDataSamplesPageUrl());
  }, [navigate]);

  useEffect(() => {
    if (!model) {
      return navigateToDataSamples();
    }
    startPredicting(bufferedData);

    return () => {
      stopPredicting();
    };
  }, [
    bufferedData,
    model,
    navigateToDataSamples,
    startPredicting,
    stopPredicting,
  ]);

  const { openEditor, resetProject, projectEdited } = useProject();
  const { getDataCollectionBoardVersion } = useConnectActions();
  const incompatibleEditorDeviceDisclosure = useDisclosure();
  const maybeOpenEditor = useCallback(async () => {
    // Open editor if device is not a V1, otherwise show warning dialog.
    if (getDataCollectionBoardVersion() === "V1") {
      return incompatibleEditorDeviceDisclosure.onOpen();
    }
    setEditorLoading(true);
    await openEditor();
    setEditorLoading(false);
  }, [
    getDataCollectionBoardVersion,
    incompatibleEditorDeviceDisclosure,
    openEditor,
  ]);
  const [editorLoading, setEditorLoading] = useState(false);
  const continueToEditor = useCallback(async () => {
    setEditorLoading(true);
    await openEditor();
    incompatibleEditorDeviceDisclosure.onClose();
    setEditorLoading(false);
  }, [incompatibleEditorDeviceDisclosure, openEditor]);

  return model ? (
    <DefaultPageLayout
      titleId="testing-model-title"
      showPageTitle
      menuItems={<ProjectMenuItems />}
      toolbarItemsRight={<ProjectToolbarItems />}
      toolbarItemsLeft={
        <Button
          leftIcon={<BackArrow />}
          variant="toolbar"
          onClick={navigateToDataSamples}
        >
          <FormattedMessage id="back-to-data-samples-action" />
        </Button>
      }
    >
      <IncompatibleEditorDevice
        isOpen={incompatibleEditorDeviceDisclosure.isOpen}
        onClose={incompatibleEditorDeviceDisclosure.onClose}
        onNext={continueToEditor}
        stage="openEditor"
        onNextLoading={editorLoading}
      />
      <TestingModelTable />
      <VStack w="full" flexShrink={0} bottom={0} gap={0} bg="gray.25">
        <HStack
          justifyContent="right"
          px={5}
          py={2}
          w="full"
          borderBottomWidth={3}
          borderTopWidth={3}
          borderColor="gray.200"
          alignItems="center"
        >
          <Menu>
            <ButtonGroup isAttached>
              <Button
                variant="primary"
                onClick={maybeOpenEditor}
                className={tourElClassname.editInMakeCodeButton}
                isLoading={
                  editorLoading && !incompatibleEditorDeviceDisclosure.isOpen
                }
              >
                <FormattedMessage id="edit-in-makecode-action" />
              </Button>
              <MoreMenuButton
                variant="primary"
                aria-label={intl.formatMessage({
                  id: "more-edit-in-makecode-options",
                })}
              />
              <Portal>
                <MenuList>
                  <MenuItem
                    icon={<RiDeleteBin2Line />}
                    onClick={resetProject}
                    isDisabled={!projectEdited}
                  >
                    <FormattedMessage id="reset-to-default-action" />
                  </MenuItem>
                </MenuList>
              </Portal>
            </ButtonGroup>
          </Menu>
        </HStack>
        <LiveGraphPanel
          showPredictedAction
          disconnectedTextId="connect-to-test-model"
        />
      </VStack>
    </DefaultPageLayout>
  ) : (
    <></>
  );
};

export default TestingModelPage;
