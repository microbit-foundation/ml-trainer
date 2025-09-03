/**
 * (c) 2023, Center for Computational Thinking and Design at Aarhus University and contributors
 * Modifications (c) 2024, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import {
  Button,
  Grid,
  GridProps,
  HStack,
  Text,
  VStack,
  Image,
} from "@chakra-ui/react";
import { ButtonEvent } from "@microbit/microbit-connection";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { useConnectActions } from "../connect-actions-hooks";
import { useConnectionStage } from "../connection-stage-hooks";
import { ActionData } from "../model";
import { useStore } from "../store";
import ConnectFirstDialog from "./ConnectFirstDialog";
import DataSamplesMenu from "./DataSamplesMenu";
import DataSamplesTableRow from "./DataSamplesTableRow";
import HeadingGrid, { GridColumnHeadingItemProps } from "./HeadingGrid";
import LoadProjectInput, { LoadProjectInputRef } from "./LoadProjectInput";
import RecordingDialog, {
  RecordingCompleteDetail,
  RecordingOptions,
} from "./RecordingDialog";
import ShowGraphsCheckbox from "./ShowGraphsCheckbox";
import { ConfirmDialog } from "./ConfirmDialog";
import { actionNameInputId } from "./ActionNameCard";
import { recordButtonId } from "./ActionDataSamplesCard";
import { keyboardShortcuts, useShortcut } from "../keyboard-shortcut-hooks";
import collectDataImage from "../images/collect-data.svg";

const gridCommonProps: Partial<GridProps> = {
  gridTemplateColumns: "290px 1fr",
  gap: 3,
  px: 5,
  w: "100%",
};

const getHeadings = (
  options: {
    hideItemsRight?: boolean;
  } = {}
): GridColumnHeadingItemProps[] => [
  {
    titleId: "action-label",
    descriptionId: "action-tooltip",
  },
  {
    titleId: "data-samples-label",
    descriptionId: "data-samples-tooltip",
    itemsRight: options.hideItemsRight ? undefined : (
      <HStack>
        <ShowGraphsCheckbox />
        <DataSamplesMenu />
      </HStack>
    ),
  },
];

interface DataSamplesTableProps {
  selectedActionIdx: number;
  setSelectedActionIdx: (idx: number) => void;
}

const DataSamplesTable = ({
  selectedActionIdx: selectedActionIdx,
  setSelectedActionIdx: setSelectedActionIdx,
}: DataSamplesTableProps) => {
  const actions = useStore((s) => s.actions);
  // Default to first action being selected if last action is deleted.
  const selectedAction: ActionData = actions[selectedActionIdx] ?? actions[0];

  const showHints = useMemo<boolean>(
    () =>
      actions.length === 0 ||
      (actions.length === 1 && actions[0].recordings.length === 0),
    [actions]
  );
  const intl = useIntl();
  const isDeleteActionConfirmOpen = useStore((s) => s.isDeleteActionDialogOpen);
  const deleteActionConfirmOnOpen = useStore((s) => s.deleteActionDialogOnOpen);
  const deleteAction = useStore((s) => s.deleteAction);
  const isRecordingDialogOpen = useStore((s) => s.isRecordingDialogOpen);
  const recordingDialogOnOpen = useStore((s) => s.recordingDialogOnOpen);
  const isConnectToRecordDialogOpen = useStore(
    (s) => s.isConnectToRecordDialogOpen
  );
  const connectToRecordDialogOnOpen = useStore(
    (s) => s.connectToRecordDialogOnOpen
  );
  const closeDialog = useStore((s) => s.closeDialog);

  const connection = useConnectActions();
  const { actions: connActions } = useConnectionStage();
  const { isConnected } = useConnectionStage();
  const loadProjectInputRef = useRef<LoadProjectInputRef>(null);

  // For adding flashing animation for new recording.
  const [newRecordingId, setNewRecordingId] = useState<number | undefined>(
    undefined
  );

  const handleConnect = useCallback(() => {
    connActions.startConnect();
  }, [connActions]);

  useEffect(() => {
    const listener = (e: ButtonEvent) => {
      if (!isRecordingDialogOpen && e.state) {
        recordingDialogOnOpen();
      }
    };
    connection.addButtonListener("B", listener);
    return () => {
      connection.removeButtonListener("B", listener);
    };
  }, [connection, isRecordingDialogOpen, recordingDialogOnOpen]);

  const [recordingOptions, setRecordingOptions] = useState<RecordingOptions>({
    continuousRecording: false,
    recordingsToCapture: 1,
  });
  const handleRecord = useCallback(
    (recordingOptions: RecordingOptions) => {
      setRecordingOptions(recordingOptions);
      isConnected ? recordingDialogOnOpen() : connectToRecordDialogOnOpen();
    },
    [connectToRecordDialogOnOpen, isConnected, recordingDialogOnOpen]
  );

  const tourStart = useStore((s) => s.tourStart);
  const handleRecordingComplete = useCallback(
    ({ mostRecentRecordingId, recordingCount }: RecordingCompleteDetail) => {
      setNewRecordingId(mostRecentRecordingId);
      tourStart({ name: "DataSamplesRecorded", recordingCount });
    },
    [tourStart]
  );

  const actionNameInputEl = useCallback(
    (idx: number) => document.getElementById(actionNameInputId(actions[idx])),
    [actions]
  );
  const recordButtonEl = useCallback(
    (idx: number) => document.getElementById(recordButtonId(actions[idx])),
    [actions]
  );
  const renameActionShortcutScopeRef = useShortcut(
    keyboardShortcuts.renameAction,
    () => actionNameInputEl(selectedActionIdx)?.focus()
  );
  const focusAction = useCallback(
    (idx: number) => {
      if (idx < 0 || idx >= actions.length) {
        // Index is out of range.
        return;
      }
      const nextRecordButton = recordButtonEl(idx);
      // If record button exists, focus on it, otherwise focus on name input instead.
      if (nextRecordButton) {
        nextRecordButton.focus();
      } else {
        actionNameInputEl(idx)?.focus();
      }
      setSelectedActionIdx(idx);
    },
    [actionNameInputEl, actions.length, recordButtonEl, setSelectedActionIdx]
  );
  useShortcut(keyboardShortcuts.focusBelowAction, () =>
    focusAction(selectedActionIdx + 1)
  );
  useShortcut(keyboardShortcuts.focusAboveAction, () =>
    focusAction(selectedActionIdx - 1)
  );

  return (
    <>
      <ConnectFirstDialog
        isOpen={isConnectToRecordDialogOpen}
        onClose={closeDialog}
        explanationTextId="connect-to-record-body"
      />
      {selectedAction && (
        <>
          <ConfirmDialog
            isOpen={isDeleteActionConfirmOpen}
            heading={intl.formatMessage({
              id: "delete-action-confirm-heading",
            })}
            body={
              <Text>
                <FormattedMessage
                  id="delete-action-confirm-text"
                  values={{
                    action: selectedAction.name,
                  }}
                />
              </Text>
            }
            onConfirm={() => {
              deleteAction(selectedAction.ID);
              closeDialog();
            }}
            onCancel={closeDialog}
          />
          <RecordingDialog
            actionId={selectedAction.ID}
            isOpen={isRecordingDialogOpen}
            onClose={closeDialog}
            actionName={selectedAction.name}
            onRecordingComplete={handleRecordingComplete}
            recordingOptions={recordingOptions}
          />
        </>
      )}
      <HeadingGrid
        position="sticky"
        top={0}
        {...gridCommonProps}
        headings={getHeadings({
          hideItemsRight: actions.length === 0 || !isConnected,
        })}
      />
      {actions.length === 0 && !isConnected ? (
        <VStack
          gap={5}
          flexGrow={1}
          alignItems="center"
          justifyContent="start"
          pt="5em"
        >
          <LoadProjectInput ref={loadProjectInputRef} accept=".json" />
          <Image src={collectDataImage} width={350} opacity={0.7} />
          <Text fontWeight="bold" fontSize="xl">
            <FormattedMessage id="no-data-samples" />
          </Text>
          <VStack gap={3}>
            <Button variant="primary" onClick={handleConnect}>
              <FormattedMessage id="connect-to-record" />
            </Button>
            <Button
              variant="secondary"
              onClick={() => loadProjectInputRef.current?.chooseFile()}
            >
              <FormattedMessage id="import-data-samples-action" />
            </Button>
          </VStack>
        </VStack>
      ) : (
        <Grid
          {...gridCommonProps}
          py={2}
          alignItems="start"
          autoRows="max-content"
          overflow="auto"
          flexGrow={1}
          h={0}
        >
          {actions.map((action, idx) => (
            <DataSamplesTableRow
              key={action.ID}
              action={action}
              newRecordingId={newRecordingId}
              clearNewRecordingId={() => setNewRecordingId(undefined)}
              selected={selectedAction.ID === action.ID}
              onSelectRow={() => setSelectedActionIdx(idx)}
              onRecord={handleRecord}
              showHints={showHints}
              onDeleteAction={deleteActionConfirmOnOpen}
              renameShortcutScopeRef={renameActionShortcutScopeRef}
            />
          ))}
        </Grid>
      )}
    </>
  );
};

export default DataSamplesTable;
