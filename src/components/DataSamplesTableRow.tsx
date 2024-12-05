/**
 * (c) 2023, Center for Computational Thinking and Design at Aarhus University and contributors
 * Modifications (c) 2024, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { Box, GridItem } from "@chakra-ui/react";
import { useIntl } from "react-intl";
import { ActionData } from "../model";
import ActionDataSamplesCard from "./ActionDataSamplesCard";
import ActionNameCard from "./ActionNameCard";
import DataSamplesTableHints from "./DataSamplesTableHints";
import { RecordingOptions } from "./RecordingDialog";
import { RefType } from "react-hotkeys-hook/dist/types";

interface DataSamplesTableRowProps {
  action: ActionData;
  selected: boolean;
  onSelectRow: () => void;
  onRecord: (recordingOptions: RecordingOptions) => void;
  showHints: boolean;
  newRecordingId?: number;
  clearNewRecordingId: () => void;
  onDeleteAction: () => void;
  renameShortcutScopeRef: (instance: RefType<HTMLElement>) => void;
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
  renameShortcutScopeRef,
}: DataSamplesTableRowProps) => {
  const intl = useIntl();

  return (
    <>
      <Box
        ref={selected ? renameShortcutScopeRef : undefined}
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
