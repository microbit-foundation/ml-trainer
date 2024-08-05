import { Grid, GridProps, useDisclosure } from "@chakra-ui/react";
import { useEffect, useMemo, useState } from "react";
import { useGestureData } from "../gestures-hooks";
import AddDataGridRow from "./AddDataGridRow";
import AddDataGridWalkThrough from "./AddDataGridWalkThrough";
import HeadingGrid from "./HeadingGrid";
import RecordingDialog from "./RecordingDialog";
import { useConnectActions } from "../connect-actions-hooks";
import { ButtonEvent } from "@microbit/microbit-connection";

const gridCommonProps: Partial<GridProps> = {
  gridTemplateColumns: "200px 1fr",
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

const AddDataGridView = () => {
  const [gestures] = useGestureData();
  const [selectedGestureIdx, setSelectedGestureIdx] = useState<number>(0);
  const selectedGesture = gestures.data[selectedGestureIdx] ?? gestures.data[0];
  const showWalkThrough = useMemo<boolean>(
    () =>
      gestures.data.length === 0 ||
      (gestures.data.length === 1 && gestures.data[0].recordings.length === 0),
    [gestures.data]
  );
  const { isOpen, onClose, onOpen } = useDisclosure();

  const connection = useConnectActions();

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
        {showWalkThrough ? (
          <AddDataGridWalkThrough
            gesture={gestures.data[0]}
            startRecording={onOpen}
          />
        ) : (
          gestures.data.map((g, idx) => (
            <AddDataGridRow
              key={g.ID}
              gesture={g}
              selected={selectedGesture.ID === g.ID}
              onSelectRow={() => setSelectedGestureIdx(idx)}
              startRecording={onOpen}
            />
          ))
        )}
      </Grid>
    </>
  );
};

export default AddDataGridView;
