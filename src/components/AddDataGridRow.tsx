import { GridItem } from "@chakra-ui/react";
import { useCallback } from "react";
import { useIntl } from "react-intl";
import { GestureData, useGestureActions } from "../gestures-hooks";
import DataRecordingGridItem from "./DataRecordingGridItem";
import GestureNameGridItem from "./GestureNameGridItem";

interface AddDataGridRowProps {
  gesture: GestureData;
  selected: boolean;
  onSelectRow: () => void;
  startRecording: () => void;
}

const AddDataGridRow = ({
  gesture,
  selected,
  onSelectRow,
  startRecording,
}: AddDataGridRowProps) => {
  const intl = useIntl();
  const actions = useGestureActions();

  const handleDeleteDataItem = useCallback(() => {
    const confirmationText = intl.formatMessage(
      { id: "alert.deleteGestureConfirm" },
      { action: gesture.name }
    );
    if (!window.confirm(confirmationText)) {
      return;
    }
    actions.deleteGesture(gesture.ID);
  }, [actions, gesture.ID, gesture.name, intl]);

  return (
    <>
      <GestureNameGridItem
        id={gesture.ID}
        name={gesture.name}
        onCloseClick={handleDeleteDataItem}
        onSelectRow={onSelectRow}
        selected={selected}
        readOnly={false}
      />
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
  );
};

export default AddDataGridRow;
