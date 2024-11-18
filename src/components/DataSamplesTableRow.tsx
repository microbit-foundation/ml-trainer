import { Box, GridItem, Text, useDisclosure } from "@chakra-ui/react";
import { FormattedMessage, useIntl } from "react-intl";
import { ActionData } from "../model";
import { useStore } from "../store";
import DataSamplesTableHints from "./DataSamplesTableHints";
import { ConfirmDialog } from "./ConfirmDialog";
import ActionDataSamplesCard from "./ActionDataSamplesCard";
import ActionNameCard from "./ActionNameCard";
import {
  ConnectionFlowStep,
  useConnectionStage,
} from "../connection-stage-hooks";
import { RecordingOptions } from "./RecordingDialog";
import { useEffect, useRef } from "react";

interface DataSamplesTableRowProps {
  action: ActionData;
  selected: boolean;
  onSelectRow: () => void;
  onRecord: (recordingOptions: RecordingOptions) => void;
  showHints: boolean;
  newRecordingId?: number;
  clearNewRecordingId: () => void;
}

const DataSamplesTableRow = ({
  action,
  selected,
  onSelectRow,
  onRecord,
  showHints: showHints,
  newRecordingId,
  clearNewRecordingId,
}: DataSamplesTableRowProps) => {
  const intl = useIntl();
  const deleteConfirmDisclosure = useDisclosure();
  const deleteAction = useStore((s) => s.deleteAction);
  const { stage } = useConnectionStage();
  const rowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let rowRefValue: HTMLElement | undefined;
    if (rowRef.current) {
      rowRef.current.addEventListener("focusin", onSelectRow);
      rowRefValue = rowRef.current;
    }
    return () => {
      rowRefValue?.removeEventListener("focusin", onSelectRow);
    };
  }, [onSelectRow]);

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
                action: action.name,
              }}
            />
          </Text>
        }
        onConfirm={() => deleteAction(action.ID)}
        onCancel={deleteConfirmDisclosure.onClose}
      />
      <Box display="contents" ref={rowRef}>
        <GridItem>
          <ActionNameCard
            value={action}
            onDeleteAction={deleteConfirmDisclosure.onOpen}
            onSelectRow={onSelectRow}
            selected={selected}
            readOnly={false}
          />
        </GridItem>
        {showHints ? (
          <DataSamplesTableHints action={action} onRecord={onRecord} />
        ) : (
          <GridItem>
            {(action.name.length > 0 || action.recordings.length > 0) && (
              <ActionDataSamplesCard
                newRecordingId={newRecordingId}
                value={action}
                selected={selected}
                onSelectRow={onSelectRow}
                onRecord={onRecord}
                clearNewRecordingId={clearNewRecordingId}
              />
            )}
          </GridItem>
        )}
      </Box>
    </>
  );
};

export default DataSamplesTableRow;
