import { GridItem } from "@chakra-ui/react";
import { useCallback } from "react";
import { useIntl } from "react-intl";
import { GestureData } from "../model";
import AddDataGridWalkThrough from "./AddDataGridWalkThrough";
import DataRecordingGridItem from "./DataRecordingGridItem";
import GestureNameGridItem from "./GestureNameGridItem";
import { useStore } from "../store";

interface AddDataGridRowProps {
  gesture: GestureData;
  selected: boolean;
  onSelectRow: () => void;
  startRecording: () => void;
  showWalkThrough: boolean;
}

const DataSampleGridRow = ({
  gesture,
  selected,
  onSelectRow,
  startRecording,
  showWalkThrough,
}: AddDataGridRowProps) => {
  const intl = useIntl();
  const deleteGesture = useStore((s) => s.deleteGesture);

  const handleDeleteDataItem = useCallback(() => {
    const confirmationText = intl.formatMessage(
      { id: "alert.deleteGestureConfirm" },
      { action: gesture.name }
    );
    if (!window.confirm(confirmationText)) {
      return;
    }
    deleteGesture(gesture.ID);
  }, [deleteGesture, gesture.ID, gesture.name, intl]);

  return (
    <>
      <GestureNameGridItem
        id={gesture.ID}
        name={gesture.name}
        icon={gesture.icon}
        onCloseClick={handleDeleteDataItem}
        onSelectRow={onSelectRow}
        selected={selected}
        readOnly={false}
      />
      {showWalkThrough ? (
        <AddDataGridWalkThrough
          gesture={gesture}
          startRecording={startRecording}
        />
      ) : (
        <>
          {gesture.name.length > 0 || gesture.recordings.length > 0 ? (
            <DataRecordingGridItem
              data={gesture}
              selected={selected}
              onSelectRow={onSelectRow}
              startRecording={startRecording}
            />
          ) : (
            // Empty grid item to fill column space
            <GridItem />
          )}
        </>
      )}
    </>
  );
};

export default DataSampleGridRow;
