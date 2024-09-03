import { GridItem, Text, useDisclosure } from "@chakra-ui/react";
import { FormattedMessage, useIntl } from "react-intl";
import { GestureData, useGestureActions } from "../gestures-hooks";
import { ConfirmDialog } from "./ConfirmDialog";
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
  const { isOpen, onOpen, onClose } = useDisclosure();
  return (
    <>
      <ConfirmDialog
        isOpen={isOpen}
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
        onConfirm={() => actions.deleteGesture(gesture.ID)}
        onCancel={onClose}
      />
      <GestureNameGridItem
        id={gesture.ID}
        name={gesture.name}
        icon={gesture.icon}
        onDeleteAction={onOpen}
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
