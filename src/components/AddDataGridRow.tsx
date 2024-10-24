import { GridItem, Text, useDisclosure } from "@chakra-ui/react";
import { FormattedMessage, useIntl } from "react-intl";
import { GestureData } from "../model";
import { useStore } from "../store";
import AddDataGridWalkThrough from "./AddDataGridWalkThrough";
import { ConfirmDialog } from "./ConfirmDialog";
import DataRecordingGridItem from "./DataRecordingGridItem";
import GestureNameGridItem from "./GestureNameGridItem";
import {
  ConnectionFlowStep,
  useConnectionStage,
} from "../connection-stage-hooks";

interface AddDataGridRowProps {
  gesture: GestureData;
  selected: boolean;
  onSelectRow: () => void;
  onRecord: () => void;
  showWalkThrough: boolean;
}

const DataSampleGridRow = ({
  gesture,
  selected,
  onSelectRow,
  onRecord,
  showWalkThrough,
}: AddDataGridRowProps) => {
  const intl = useIntl();
  const deleteConfirmDisclosure = useDisclosure();
  const deleteGesture = useStore((s) => s.deleteGesture);
  const { stage } = useConnectionStage();

  return (
    <>
      <ConfirmDialog
        isOpen={
          deleteConfirmDisclosure.isOpen &&
          stage.flowStep === ConnectionFlowStep.None
        }
        heading={intl.formatMessage({
          id: "delete-action-confirm-heading",
        })}
        body={
          <Text>
            <FormattedMessage
              id="delete-action-confirm-text"
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
        <AddDataGridWalkThrough gesture={gesture} onRecord={onRecord} />
      ) : (
        <>
          {gesture.name.length > 0 || gesture.recordings.length > 0 ? (
            <DataRecordingGridItem
              data={gesture}
              selected={selected}
              onSelectRow={onSelectRow}
              onRecord={onRecord}
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
