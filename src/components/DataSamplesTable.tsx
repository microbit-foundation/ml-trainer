import {
  Button,
  Grid,
  GridProps,
  HStack,
  Text,
  VStack,
} from "@chakra-ui/react";
import { ButtonEvent } from "@microbit/microbit-connection";
import {
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
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
            onConfirm={() => deleteAction(selectedAction.ID)}
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
      {actions.length === 0 ? (
        <VStack
          gap={5}
          flexGrow={1}
          alignItems="center"
          justifyContent="center"
        >
          <LoadProjectInput ref={loadProjectInputRef} accept=".json" />
          <Text fontSize="lg">
            <FormattedMessage id="no-data-samples" />
          </Text>
          {!isConnected && (
            <Text fontSize="lg" textAlign="center">
              <FormattedMessage
                id="connect-or-import"
                values={{
                  link1: (chunks: ReactNode) => (
                    <Button
                      fontSize="lg"
                      color="brand.600"
                      variant="link"
                      onClick={handleConnect}
                    >
                      {chunks}
                    </Button>
                  ),
                  link2: (chunks: ReactNode) => (
                    <Button
                      fontSize="lg"
                      color="brand.600"
                      variant="link"
                      onClick={() => loadProjectInputRef.current?.chooseFile()}
                    >
                      {chunks}
                    </Button>
                  ),
                }}
              />
            </Text>
          )}
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
            />
          ))}
        </Grid>
      )}
    </>
  );
};

export default DataSamplesTable;
