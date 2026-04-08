/**
 * (c) 2024, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { isAndroid } from "../platform";
import {
  Icon,
  IconButton,
  MenuButton,
  MenuDivider,
  MenuItem,
  MenuList,
  Portal,
  Text,
  useToast,
} from "@chakra-ui/react";
import { useCallback } from "react";
import { MdMoreVert } from "react-icons/md";
import {
  RiDeleteBin2Line,
  RiDownload2Line,
  RiUpload2Line,
} from "react-icons/ri";
import { FormattedMessage, useIntl } from "react-intl";
import { useProjectIsUntitled } from "../hooks/project-hooks";
import { useLogging } from "../logging/logging-hooks";
import { useStore } from "../store";
import { getTotalNumSamples } from "../utils/actions";
import { ConfirmDialog } from "./ConfirmDialog";
import LoadProjectMenuItem from "./LoadProjectMenuItem";
import Menu from "./Menu";
import { NameProjectDialog } from "./NameProjectDialog";
import ViewDataFeaturesMenuItem from "./ViewDataFeaturesMenuItem";

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
  const toast = useToast();

  const download = useCallback(async () => {
    logging.event({
      type: "dataset-save",
      detail: {
        actions: actions.length,
        samples: getTotalNumSamples(actions),
      },
    });
    await downloadDataset();
    if (isAndroid()) {
      // Android saves to Downloads with no browser feedback;
      // iOS share sheet provides its own; web has the browser download bar.
      toast({
        id: "save-complete",
        position: "top",
        duration: 5_000,
        title: intl.formatMessage({ id: "saving-dataset-toast-title" }),
        status: "info",
      });
    }
  }, [actions, downloadDataset, intl, logging, toast]);
  const deleteAllActions = useStore((s) => s.deleteAllActions);
  const handleDeleteAllActions = useCallback(async () => {
    logging.event({
      type: "dataset-delete",
    });
    await deleteAllActions();
    closeDialog();
  }, [closeDialog, deleteAllActions, logging]);

  // called if nameProjectDialog was launched from handleDownloadDataset
  const handleSave = useCallback(
    async (newName?: string) => {
      if (newName) {
        await setProjectName(newName);
      }
      await download();
      closeDialog();
    },
    [closeDialog, download, setProjectName]
  );

  const handleDownloadDataset = useCallback(async () => {
    if (isUntitled) {
      nameProjectDialogOnOpen();
    } else {
      await download();
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
