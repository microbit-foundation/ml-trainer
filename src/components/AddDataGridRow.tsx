import { GridItem, Text, useDisclosure } from "@chakra-ui/react";
import { FormattedMessage, useIntl } from "react-intl";
import { GestureData } from "../model";
import { useStore } from "../store";
import AddDataGridWalkThrough from "./AddDataGridWalkThrough";
import { ConfirmDialog } from "./ConfirmDialog";
import DataRecordingGridItem from "./DataRecordingGridItem";
import GestureNameGridItem from "./GestureNameGridItem";

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
  const deleteConfirmDisclosure = useDisclosure();
  const deleteGesture = useStore((s) => s.deleteGesture);
  return (
    <>
      <ConfirmDialog
        isOpen={deleteConfirmDisclosure.isOpen}
        heading={intl.formatMessage({
          id: "alert.deleteGestureConfirmHeading",
        })}
        body={
          <Text>
            <FormattedMessage
              id="alert.deleteGestureConfirm"
              values={{
                action: gesture.name,
              }}
            />
          </Text>
        }
        onConfirm={() => deleteGesture(gesture.ID)}
        onCancel={deleteConfirmDisclosure.onClose}
      />
      <GestureNameGridItem
        id={gesture.ID}
        name={gesture.name}
        icon={gesture.icon}
        onDeleteAction={deleteConfirmDisclosure.onOpen}
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
