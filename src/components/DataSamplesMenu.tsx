/**
 * (c) 2024, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
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
} from "@chakra-ui/react";
import { useCallback } from "react";
import { MdMoreVert } from "react-icons/md";
import {
  RiDeleteBin2Line,
  RiDownload2Line,
  RiUpload2Line,
} from "react-icons/ri";
import { FormattedMessage, useIntl } from "react-intl";
import { useLogging } from "../logging/logging-hooks";
import { useStore } from "../store";
import { getTotalNumSamples } from "../utils/actions";
import { ConfirmDialog } from "./ConfirmDialog";
import LoadProjectMenuItem from "./LoadProjectMenuItem";
import { NameProjectDialog } from "./NameProjectDialog";
import ViewDataFeaturesMenuItem from "./ViewDataFeaturesMenuItem";
import { useProjectIsUntitled } from "../hooks/project-hooks";

const DataSamplesMenu = () => {
  const intl = useIntl();
  const logging = useLogging();
  const actions = useStore((s) => s.actions);
  const downloadDataset = useStore((s) => s.downloadDataset);
  const isDeleteAllActionsDialogOpen = useStore(
    (s) => s.isDeleteAllActionsDialogOpen
  );
  const deleteAllActionsDialogOnOpen = useStore(
    (s) => s.deleteAllActionsDialogOnOpen
  );
  const closeDialog = useStore((s) => s.closeDialog);
  const isNameProjectDialogOpen = useStore((s) => s.isNameProjectDialogOpen);
  const nameProjectDialogOnOpen = useStore((s) => s.nameProjectDialogOnOpen);
  const isUntitled = useProjectIsUntitled();
  const setProjectName = useStore((s) => s.setProjectName);

  const download = useCallback(() => {
    logging.event({
      type: "dataset-save",
      detail: {
        actions: actions.length,
        samples: getTotalNumSamples(actions),
      },
    });
    downloadDataset();
  }, [downloadDataset, actions, logging]);
  const deleteAllActions = useStore((s) => s.deleteAllActions);
  const handleDeleteAllActions = useCallback(() => {
    logging.event({
      type: "dataset-delete",
    });
    deleteAllActions();
    closeDialog();
  }, [closeDialog, deleteAllActions, logging]);

  const handleSave = useCallback(
    (newName?: string) => {
      if (newName) {
        setProjectName(newName);
      }
      download();
      closeDialog();
    },
    [closeDialog, download, setProjectName]
  );

  const handleDownloadDataset = useCallback(() => {
    if (isUntitled) {
      nameProjectDialogOnOpen();
    } else {
      download();
    }
  }, [download, isUntitled, nameProjectDialogOnOpen]);

  return (
    <>
      <NameProjectDialog
        isOpen={isNameProjectDialogOpen}
        onClose={closeDialog}
        onSave={handleSave}
      />
      <ConfirmDialog
        isOpen={isDeleteAllActionsDialogOpen}
        heading={intl.formatMessage({
          id: "delete-data-samples-confirm-heading",
        })}
        body={
          <Text>
            <FormattedMessage id="delete-data-samples-confirm-text" />
          </Text>
        }
        onConfirm={handleDeleteAllActions}
        onCancel={closeDialog}
      />
      <Menu>
        <MenuButton
          as={IconButton}
          aria-label={intl.formatMessage({
            id: "data-actions-menu",
          })}
          color="gray.800"
          variant="ghost"
          icon={<Icon as={MdMoreVert} boxSize={7} />}
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
              onClick={deleteAllActionsDialogOnOpen}
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
