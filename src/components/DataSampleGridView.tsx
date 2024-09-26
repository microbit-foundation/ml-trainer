import { Grid, GridProps, useDisclosure } from "@chakra-ui/react";
import { ButtonEvent } from "@microbit/microbit-connection";
import { useEffect, useMemo, useState } from "react";
import { useConnectActions } from "../connect-actions-hooks";
import DataSampleGridRow from "./AddDataGridRow";
import HeadingGrid from "./HeadingGrid";
import RecordingDialog from "./RecordingDialog";
import { useStore } from "../store";
import ConnectToRecordDialog from "./ConnectToRecordDialog";
import { useConnectionStage } from "../connection-stage-hooks";

const gridCommonProps: Partial<GridProps> = {
  gridTemplateColumns: "290px 1fr",
  gap: 3,
  px: 10,
  py: 2,
  w: "100%",
};

const headings = [
  {
    titleId: "content.data.classification",
    descriptionId: "content.data.classHelpBody",
  },
  {
    titleId: "content.data.data",
    descriptionId: "content.data.dataDescription",
  },
];

const DataSamplesGridView = () => {
  const gestures = useStore((s) => s.gestures);
  const [selectedGestureIdx, setSelectedGestureIdx] = useState<number>(0);
  const selectedGesture = gestures[selectedGestureIdx] ?? gestures[0];
  const showWalkThrough = useMemo<boolean>(
    () =>
      gestures.length === 0 ||
      (gestures.length === 1 && gestures[0].recordings.length === 0),
    [gestures]
  );
  const { isOpen, onClose, onOpen } = useDisclosure();
  const connectToRecordDialogDisclosure = useDisclosure();

  const connection = useConnectActions();
  const { isConnected } = useConnectionStage();

  useEffect(() => {
    const listener = (e: ButtonEvent) => {
      if (!isOpen) {
        if (e.state) {
          onOpen();
        }
      }
    };
    connection.addButtonListener("B", listener);
    return () => {
      connection.removeButtonListener("B", listener);
    };
  }, [connection, isOpen, onOpen]);

  return (
    <>
      <RecordingDialog
        gestureId={selectedGesture.ID}
        isOpen={isOpen}
        onClose={onClose}
        actionName={selectedGesture.name}
      />
      <ConnectToRecordDialog
        isOpen={connectToRecordDialogDisclosure.isOpen}
        onClose={connectToRecordDialogDisclosure.onClose}
      />
      <HeadingGrid
        position="sticky"
        top={0}
        {...gridCommonProps}
        headings={headings}
      />
      <Grid
        {...gridCommonProps}
        alignItems="start"
        autoRows="max-content"
        overflow="auto"
        flexGrow={1}
        h={0}
      >
        {gestures.map((g, idx) => (
          <DataSampleGridRow
            key={g.ID}
            gesture={g}
            selected={selectedGesture.ID === g.ID}
            onSelectRow={() => setSelectedGestureIdx(idx)}
            onRecord={
              isConnected ? onOpen : connectToRecordDialogDisclosure.onOpen
            }
            showWalkThrough={showWalkThrough}
          />
        ))}
      </Grid>
    </>
  );
};

export default DataSamplesGridView;
