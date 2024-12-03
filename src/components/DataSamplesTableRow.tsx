import { Box, GridItem } from "@chakra-ui/react";
import { useIntl } from "react-intl";
import { ActionData } from "../model";
import ActionDataSamplesCard from "./ActionDataSamplesCard";
import ActionNameCard from "./ActionNameCard";
import DataSamplesTableHints from "./DataSamplesTableHints";
import { RecordingOptions } from "./RecordingDialog";

interface DataSamplesTableRowProps {
  action: ActionData;
  selected: boolean;
  onSelectRow: () => void;
  onRecord: (recordingOptions: RecordingOptions) => void;
  showHints: boolean;
  newRecordingId?: number;
  clearNewRecordingId: () => void;
  onDeleteAction: () => void;
}

const DataSamplesTableRow = ({
  action,
  selected,
  onSelectRow,
  onRecord,
  showHints: showHints,
  newRecordingId,
  clearNewRecordingId,
  onDeleteAction,
}: DataSamplesTableRowProps) => {
  const intl = useIntl();

  return (
    <>
      <Box
        role="region"
        aria-label={intl.formatMessage(
          {
            id: "action-region",
          },
          { action: action.name }
        )}
        display="contents"
        onFocusCapture={onSelectRow}
      >
        <GridItem>
          <ActionNameCard
            value={action}
            onDeleteAction={onDeleteAction}
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
