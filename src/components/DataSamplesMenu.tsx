import {
  Icon,
  IconButton,
  Menu,
  MenuButton,
  MenuDivider,
  MenuItem,
  MenuList,
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
import {
  ConnectionFlowStep,
  useConnectionStage,
} from "../connection-stage-hooks";
import { useLogging } from "../logging/logging-hooks";
import { useStore } from "../store";
import { getTotalNumSamples } from "../utils/gestures";
import { ConfirmDialog } from "./ConfirmDialog";
import LoadProjectMenuItem from "./LoadProjectMenuItem";
import { NameProjectDialog } from "./NameProjectDialog";
import ViewDataFeaturesMenuItem from "./ViewDataFeaturesMenuItem";
import { useHasUntitledProjectName } from "../hooks/project-hooks";

const DataSamplesMenu = () => {
  const intl = useIntl();
  const logging = useLogging();
  const gestures = useStore((s) => s.gestures);
  const downloadDataset = useStore((s) => s.downloadDataset);
  const { stage } = useConnectionStage();
  const deleteConfirmDisclosure = useDisclosure();
  const nameProjectDialogDisclosure = useDisclosure();
  const isUntitled = useHasUntitledProjectName();
  const setProjectName = useStore((s) => s.setProjectName);

  const download = useCallback(() => {
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

  const handleSave = useCallback(
    (newName?: string) => {
      if (newName) {
        setProjectName(newName);
      }
      download();
      nameProjectDialogDisclosure.onClose();
    },
    [download, nameProjectDialogDisclosure, setProjectName]
  );

  const handleDownloadDataset = useCallback(() => {
    if (isUntitled) {
      nameProjectDialogDisclosure.onOpen();
    } else {
      download();
    }
  }, [download, isUntitled, nameProjectDialogDisclosure]);

  return (
    <>
      <NameProjectDialog
        isOpen={
          stage.flowStep === ConnectionFlowStep.None &&
          nameProjectDialogDisclosure.isOpen
        }
        onClose={nameProjectDialogDisclosure.onClose}
        onSave={handleSave}
      />
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
            <MenuDivider />
            <ViewDataFeaturesMenuItem />
          </MenuList>
        </Portal>
      </Menu>
    </>
  );
};

export default DataSamplesMenu;
