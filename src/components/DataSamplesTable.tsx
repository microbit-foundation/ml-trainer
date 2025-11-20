/**
 * (c) 2023, Center for Computational Thinking and Design at Aarhus University and contributors
 * Modifications (c) 2024, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { Grid, GridProps, HStack, Text } from "@chakra-ui/react";
import { ButtonEvent } from "@microbit/microbit-connection";
import { useCallback, useEffect, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { useConnectActions } from "../connect-actions-hooks";
import { useConnectionStage } from "../connection-stage-hooks";
import { keyboardShortcuts, useShortcut } from "../keyboard-shortcut-hooks";
import { ActionData, DataSamplesPageHint } from "../model";
import { useStore } from "../store";
import { recordButtonId } from "./ActionDataSamplesCard";
import { actionNameInputId } from "./ActionNameCard";
import { ConfirmDialog } from "./ConfirmDialog";
import ConnectFirstDialog from "./ConnectFirstDialog";
import DataSamplesMenu from "./DataSamplesMenu";
import DataSamplesTableRow from "./DataSamplesTableRow";
import HeadingGrid, { GridColumnHeadingItemProps } from "./HeadingGrid";
import RecordingDialog, {
  RecordingCompleteDetail,
  RecordingOptions,
} from "./RecordingDialog";
import ShowGraphsCheckbox from "./ShowGraphsCheckbox";

const gridCommonProps: Partial<GridProps> = {
  gridTemplateColumns: "290px 1fr",
  gap: 3,
  px: 5,
  w: "100%",
};

const headings: GridColumnHeadingItemProps[] = [
  {
    titleId: "action-label",
    descriptionId: "action-tooltip",
  },
  {
    titleId: "data-samples-label",
    descriptionId: "data-samples-tooltip",
    itemsRight: (
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
  hint: DataSamplesPageHint;
}

const DataSamplesTable = ({
  selectedActionIdx: selectedActionIdx,
  setSelectedActionIdx: setSelectedActionIdx,
  hint,
}: DataSamplesTableProps) => {
  const actions = useStore((s) => s.actions);
  // Default to first action being selected if last action is deleted.
  const selectedAction: ActionData = actions[selectedActionIdx] ?? actions[0];

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
  const { isConnected } = useConnectionStage();

  // For adding flashing animation for new recording.
  const [newRecordingId, setNewRecordingId] = useState<number | undefined>(
    undefined
  );

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
        headings={headings}
      />
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
            // Only show hint for the last row.
            hint={idx === actions.length - 1 ? hint : null}
            onDeleteAction={deleteActionConfirmOnOpen}
            renameShortcutScopeRef={renameActionShortcutScopeRef}
          />
        ))}
      </Grid>
    </>
  );
};

export default DataSamplesTable;
