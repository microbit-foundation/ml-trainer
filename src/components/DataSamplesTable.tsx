import {
  Button,
  Grid,
  GridProps,
  Text,
  useDisclosure,
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
import { FormattedMessage } from "react-intl";
import { useConnectActions } from "../connect-actions-hooks";
import { useConnectionStage } from "../connection-stage-hooks";
import { GestureData } from "../model";
import { useStore } from "../store";
import ConnectToRecordDialog from "./ConnectToRecordDialog";
import DataSamplesTableRow from "./DataSamplesTableRow";
import DataSamplesMenu from "./DataSamplesMenu";
import HeadingGrid, { GridColumnHeadingItemProps } from "./HeadingGrid";
import LoadProjectInput, { LoadProjectInputRef } from "./LoadProjectInput";
import RecordingDialog, { RecordingOptions } from "./RecordingDialog";

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
    itemsRight: <DataSamplesMenu />,
  },
];

interface DataSamplesTableProps {
  selectedGestureIdx: number;
  setSelectedGestureIdx: (idx: number) => void;
}

const DataSamplesTable = ({
  selectedGestureIdx,
  setSelectedGestureIdx,
}: DataSamplesTableProps) => {
  const gestures = useStore((s) => s.gestures);
  // Default to first gesture being selected if last gesture is deleted.
  const selectedGesture: GestureData =
    gestures[selectedGestureIdx] ?? gestures[0];

  const showHints = useMemo<boolean>(
    () =>
      gestures.length === 0 ||
      (gestures.length === 1 && gestures[0].recordings.length === 0),
    [gestures]
  );
  const recordingDialogDisclosure = useDisclosure();
  const connectToRecordDialogDisclosure = useDisclosure();

  const connection = useConnectActions();
  const { actions } = useConnectionStage();
  const { isConnected } = useConnectionStage();
  const loadProjectInputRef = useRef<LoadProjectInputRef>(null);

  // For adding flashing animation for new recording.
  const [newRecordingId, setNewRecordingId] = useState<number | undefined>(
    undefined
  );

  useEffect(() => {
    const listener = (e: ButtonEvent) => {
      if (!recordingDialogDisclosure.isOpen) {
        if (e.state) {
          recordingDialogDisclosure.onOpen();
        }
      }
    };
    connection.addButtonListener("B", listener);
    return () => {
      connection.removeButtonListener("B", listener);
    };
  }, [connection, recordingDialogDisclosure]);

  const [recordingOptions, setRecordingOptions] = useState<RecordingOptions>({
    continuousRecording: false,
    recordingsToCapture: 1,
  });
  const handleRecord = useCallback(
    (recordingOptions: RecordingOptions) => {
      setRecordingOptions(recordingOptions);
      isConnected
        ? recordingDialogDisclosure.onOpen()
        : connectToRecordDialogDisclosure.onOpen();
    },
    [connectToRecordDialogDisclosure, isConnected, recordingDialogDisclosure]
  );
  return (
    <>
      <ConnectToRecordDialog
        isOpen={connectToRecordDialogDisclosure.isOpen}
        onClose={connectToRecordDialogDisclosure.onClose}
      />
      {selectedGesture && (
        <RecordingDialog
          gestureId={selectedGesture.ID}
          isOpen={recordingDialogDisclosure.isOpen}
          onClose={recordingDialogDisclosure.onClose}
          actionName={selectedGesture.name}
          onRecordingComplete={setNewRecordingId}
          recordingOptions={recordingOptions}
        />
      )}
      <HeadingGrid
        position="sticky"
        top={0}
        {...gridCommonProps}
        headings={headings}
      />
      {gestures.length === 0 ? (
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
                      onClick={actions.startConnect}
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
          {gestures.map((g, idx) => (
            <DataSamplesTableRow
              key={g.ID}
              gesture={g}
              newRecordingId={newRecordingId}
              clearNewRecordingId={() => setNewRecordingId(undefined)}
              selected={selectedGesture.ID === g.ID}
              onSelectRow={() => setSelectedGestureIdx(idx)}
              onRecord={handleRecord}
              showHints={showHints}
            />
          ))}
        </Grid>
      )}
    </>
  );
};

export default DataSamplesTable;
