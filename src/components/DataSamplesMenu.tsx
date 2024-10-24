import {
  Icon,
  IconButton,
  Menu,
  MenuButton,
  MenuDivider,
  MenuItem,
  MenuItemOption,
  MenuList,
  MenuOptionGroup,
  Portal,
  Text,
  useDisclosure,
} from "@chakra-ui/react";
import { useCallback } from "react";
import { MdMoreVert } from "react-icons/md";
import {
  RiDeleteBin2Line,
  RiDownload2Line,
  RiUpload2Line,
} from "react-icons/ri";
import { FormattedMessage, useIntl } from "react-intl";
import { flags } from "../flags";
import { useLogging } from "../logging/logging-hooks";
import { DataSamplesView } from "../model";
import { useStore } from "../store";
import { getTotalNumSamples } from "../utils/gestures";
import { ConfirmDialog } from "./ConfirmDialog";
import LoadProjectMenuItem from "./LoadProjectMenuItem";
import {
  ConnectionFlowStep,
  useConnectionStage,
} from "../connection-stage-hooks";

const DataSamplesMenu = () => {
  const intl = useIntl();
  const logging = useLogging();
  const gestures = useStore((s) => s.gestures);
  const downloadDataset = useStore((s) => s.downloadDataset);
  const setDataSamplesView = useStore((s) => s.setDataSamplesView);
  const dataSamplesView = useStore((s) => s.settings.dataSamplesView);
  const deleteConfirmDisclosure = useDisclosure();
  const { stage } = useConnectionStage();
  const handleDownloadDataset = useCallback(() => {
    logging.event({
      type: "dataset-save",
      detail: {
        actions: gestures.length,
        samples: getTotalNumSamples(gestures),
      },
    });
    downloadDataset();
  }, [downloadDataset, gestures, logging]);
  const deleteAllGestures = useStore((s) => s.deleteAllGestures);
  const handleDeleteAllGestures = useCallback(() => {
    logging.event({
      type: "dataset-delete",
    });
    deleteAllGestures();
    deleteConfirmDisclosure.onClose();
  }, [deleteAllGestures, deleteConfirmDisclosure, logging]);
  const handleViewChange = useCallback(
    (view: string | string[]) => {
      if (typeof view === "string") {
        setDataSamplesView(view as DataSamplesView);
      }
    },
    [setDataSamplesView]
  );
  return (
    <>
      <ConfirmDialog
        isOpen={
          deleteConfirmDisclosure.isOpen &&
          stage.flowStep === ConnectionFlowStep.None
        }
        heading={intl.formatMessage({
          id: "delete-data-samples-confirm-heading",
        })}
        body={
          <Text>
            <FormattedMessage id="delete-data-samples-confirm-text" />
          </Text>
        }
        onConfirm={handleDeleteAllGestures}
        onCancel={deleteConfirmDisclosure.onClose}
      />
      <Menu>
        <MenuButton
          as={IconButton}
          aria-label={intl.formatMessage({
            id: "data-actions-menu",
          })}
          variant="ghost"
          icon={<Icon as={MdMoreVert} color="gray.800" boxSize={7} />}
          isRound
        />
        <Portal>
          <MenuList>
            {flags.fingerprints && (
              <>
                <MenuOptionGroup
                  defaultValue={dataSamplesView}
                  title={intl.formatMessage({
                    id: "data-samples-view-options-heading",
                  })}
                  type="radio"
                  onChange={handleViewChange}
                >
                  <MenuItemOption value={DataSamplesView.Graph}>
                    <FormattedMessage id="data-samples-view-graph-option" />
                  </MenuItemOption>
                  <MenuItemOption value={DataSamplesView.DataFeatures}>
                    <FormattedMessage id="data-samples-view-data-features-option" />
                  </MenuItemOption>
                  <MenuItemOption value={DataSamplesView.GraphAndDataFeatures}>
                    <FormattedMessage id="data-samples-view-graph-and-data-features-option" />
                  </MenuItemOption>
                </MenuOptionGroup>
                <MenuDivider />
              </>
            )}
            <LoadProjectMenuItem icon={<RiUpload2Line />} accept=".json">
              <FormattedMessage id="import-data-samples-action" />
            </LoadProjectMenuItem>
            <MenuItem
              icon={<RiDownload2Line />}
              onClick={handleDownloadDataset}
            >
              <FormattedMessage id="download-data-samples-action" />
            </MenuItem>
            <MenuItem
              icon={<RiDeleteBin2Line />}
              onClick={deleteConfirmDisclosure.onOpen}
            >
              <FormattedMessage id="delete-data-samples-action" />
            </MenuItem>
          </MenuList>
        </Portal>
      </Menu>
    </>
  );
};

export default DataSamplesMenu;
