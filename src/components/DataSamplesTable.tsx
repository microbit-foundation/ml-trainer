/**
 * (c) 2023, Center for Computational Thinking and Design at Aarhus University and contributors
 * Modifications (c) 2024, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { Grid, GridProps, HStack, Text } from "@chakra-ui/react";
import { ButtonData } from "@microbit/microbit-connection";
import { useCallback, useEffect, useRef, useState } from "react";
import useKeyboardHeight from "../hooks/use-keyboard-height";
import { isIOS } from "../platform";
import { FormattedMessage, useIntl } from "react-intl";
import { useMicrobitButtonListener } from "../hooks/use-microbit-button-listener";
import { useDataConnected } from "../data-connection-flow";
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
  const keyboardHeight = useKeyboardHeight();
  const gridRef = useRef<HTMLDivElement>(null);

  // Calculate how much of the grid is actually obscured by the keyboard.
  // The keyboard covers bottomContent first, so the grid loses less than
  // the full keyboard height. Extra padding ensures the last item isn't
  // flush against the keyboard edge.
  const extraPadding = isIOS() ? 32 : 16;
  const [gridPadding, setGridPadding] = useState(0);
  useEffect(() => {
    if (keyboardHeight > 0 && gridRef.current) {
      const gridBottom = gridRef.current.getBoundingClientRect().bottom;
      const visibleBottom = window.innerHeight - keyboardHeight;
      const obscured = gridBottom - visibleBottom;
      setGridPadding(obscured > 0 ? obscured + extraPadding : 0);
    } else {
      setGridPadding(0);
    }
  }, [extraPadding, keyboardHeight]);

  // Scroll the focused element into view after the padding has been applied,
  // so the scroll container has enough room.
  useEffect(() => {
    if (gridPadding > 0 && document.activeElement instanceof HTMLElement) {
      document.activeElement.scrollIntoView({
        block: "center",
        behavior: "smooth",
      });
    }
  }, [gridPadding]);

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
  const tourState = useStore((s) => s.tourState);

  const isConnected = useDataConnected();

  // For adding flashing animation for new recording.
  const [newRecordingId, setNewRecordingId] = useState<string | undefined>(
    undefined
  );

  const [recordingOptions, setRecordingOptions] = useState<RecordingOptions>({
    continuousRecording: false,
    recordingsToCapture: 1,
  });

  const buttonListener = useCallback(
    (e: ButtonData) => {
      // Allow Button B recording when tour is not in progress and the
      // record button for selected action is displayed.
      if (
        !isRecordingDialogOpen &&
        e.state &&
        tourState === undefined &&
        (selectedAction.name.length > 0 || selectedAction.recordings.length > 0)
      ) {
        setRecordingOptions({
          continuousRecording: false,
          recordingsToCapture: 1,
        });
        recordingDialogOnOpen();
      }
    },
    [isRecordingDialogOpen, recordingDialogOnOpen, selectedAction, tourState]
  );

  useMicrobitButtonListener("B", buttonListener);
  const handleRecord = useCallback(
    (recordingOptions: RecordingOptions) => {
      setRecordingOptions(recordingOptions);
      isConnected ? recordingDialogOnOpen() : connectToRecordDialogOnOpen();
    },
    [connectToRecordDialogOnOpen, isConnected, recordingDialogOnOpen]
  );

  const tourStart = useStore((s) => s.tourStart);
  const handleRecordingComplete = useCallback(
    async ({
      mostRecentRecordingId,
      recordingCount,
    }: RecordingCompleteDetail) => {
      setNewRecordingId(mostRecentRecordingId);
      await tourStart({ name: "DataSamplesRecorded", recordingCount });
    },
    [tourStart]
  );

  const handleConfirm = useCallback(async () => {
    await deleteAction(selectedAction);
    closeDialog();
  }, [closeDialog, deleteAction, selectedAction]);

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
  const arrowNavRef = useShortcut(
    keyboardShortcuts.focusVerticalAction,
    (_, hotkeyAction) =>
      focusAction(selectedActionIdx + (hotkeyAction.hotkey === "down" ? 1 : -1))
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
            onConfirm={handleConfirm}
            onCancel={closeDialog}
          />
          <RecordingDialog
            actionId={selectedAction.id}
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
        ref={gridRef}
        {...gridCommonProps}
        py={2}
        pb={gridPadding > 0 ? `${gridPadding}px` : 2}
        alignItems="start"
        autoRows="max-content"
        overflow="auto"
        flexGrow={1}
        h={0}
        ref={arrowNavRef}
      >
        {actions.map((action, idx) => (
          <DataSamplesTableRow
            key={action.id}
            action={action}
            newRecordingId={newRecordingId}
            clearNewRecordingId={() => setNewRecordingId(undefined)}
            selected={selectedAction.id === action.id}
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
