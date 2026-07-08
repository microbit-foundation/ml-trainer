/**
 * (c) 2024, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { useCallback, useRef } from "react";
import { MdMoreVert } from "react-icons/md";
import {
  RiDeleteBin2Line,
  RiDownload2Line,
  RiUpload2Line,
} from "react-icons/ri";
import { FormattedMessage, useIntl } from "react-intl";
import { useProjectIsUntitled } from "../hooks/project-hooks";
import { useLogging } from "../logging/logging-hooks";
import { isAndroid } from "../platform";
import {
  Icon,
  IconButton,
  MenuDivider,
  MenuItem,
  MenuList,
  MenuTrigger,
  Text,
  useToast,
} from "../shared-ui";
import { useStore } from "../store";
import { getTotalNumSamples } from "../utils/actions";
import { ConfirmDialog } from "./ConfirmDialog";
import LoadProjectInput, { LoadProjectInputRef } from "./LoadProjectInput";
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
  const loadProjectInputRef = useRef<LoadProjectInputRef>(null);

  const download = useCallback(async () => {
    logging.event({
      type: "dataset_save",
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
        duration: 5_000,
        title: intl.formatMessage({ id: "saving-dataset-toast-title" }),
        status: "info",
      });
    }
  }, [actions, downloadDataset, intl, logging, toast]);
  const deleteAllActions = useStore((s) => s.deleteAllActions);
  const handleDeleteAllActions = useCallback(async () => {
    logging.event({
      type: "dataset_clear",
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
      <MenuTrigger>
        <IconButton
          aria-label={intl.formatMessage({
            id: "data-actions-menu",
          })}
          variant="ghost"
          isRound
          css={{ color: "gray.800" }}
        >
          <Icon as={MdMoreVert} css={{ width: 7, height: 7 }} />
        </IconButton>
        <MenuList>
          <MenuItem
            icon={<Icon as={RiUpload2Line} />}
            onAction={() =>
              loadProjectInputRef.current?.chooseFile("replaceActions")
            }
            textValue={intl.formatMessage({ id: "import-data-samples-action" })}
          >
            <FormattedMessage id="import-data-samples-action" />
          </MenuItem>
          <MenuItem
            icon={<Icon as={RiDownload2Line} />}
            onAction={handleDownloadDataset}
            textValue={intl.formatMessage({
              id: "download-data-samples-action",
            })}
          >
            <FormattedMessage id="download-data-samples-action" />
          </MenuItem>
          <MenuItem
            icon={<Icon as={RiDeleteBin2Line} />}
            onAction={deleteAllActionsDialogOnOpen}
            textValue={intl.formatMessage({ id: "delete-data-samples-action" })}
          >
            <FormattedMessage id="delete-data-samples-action" />
          </MenuItem>
          <MenuDivider />
          <ViewDataFeaturesMenuItem />
        </MenuList>
      </MenuTrigger>
      {/* Outside the menu: the RAC popover unmounts on close, which would
          drop the file input's change event mid-pick. */}
      <LoadProjectInput ref={loadProjectInputRef} accept=".json" />
    </>
  );
};

export default DataSamplesMenu;
