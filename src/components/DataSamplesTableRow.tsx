import { GridItem, Text, useDisclosure } from "@chakra-ui/react";
import { FormattedMessage, useIntl } from "react-intl";
import { GestureData } from "../model";
import { useStore } from "../store";
import DataSamplesTableHints from "./DataSamplesTableHints";
import { ConfirmDialog } from "./ConfirmDialog";
import ActionDataSamplesCard from "./ActionDataSamplesCard";
import ActionNameCard from "./ActionNameCard";
import {
  ConnectionFlowStep,
  useConnectionStage,
} from "../connection-stage-hooks";

interface DataSamplesTableRowProps {
  gesture: GestureData;
  selected: boolean;
  onSelectRow: () => void;
  onRecord: (recordingsToCapture: number, continuousRecording: boolean) => void;
  showHints: boolean;
  newRecordingId?: number;
}

const DataSamplesTableRow = ({
  gesture,
  selected,
  onSelectRow,
  onRecord,
  showHints: showHints,
  newRecordingId,
}: DataSamplesTableRowProps) => {
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
      <GridItem>
        <ActionNameCard
          value={gesture}
          onDeleteAction={deleteConfirmDisclosure.onOpen}
          onSelectRow={onSelectRow}
          selected={selected}
          readOnly={false}
        />
      </GridItem>
      {showHints ? (
        <DataSamplesTableHints gesture={gesture} onRecord={onRecord} />
      ) : (
        <GridItem>
          {(gesture.name.length > 0 || gesture.recordings.length > 0) && (
            <ActionDataSamplesCard
              newRecordingId={newRecordingId}
              value={gesture}
              selected={selected}
              onSelectRow={onSelectRow}
              onRecord={onRecord}
            />
          )}
        </GridItem>
      )}
    </>
  );
};

export default DataSamplesTableRow;
