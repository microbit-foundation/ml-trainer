/**
 * (c) 2023, Center for Computational Thinking and Design at Aarhus University and contributors
 * Modifications (c) 2024, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { Box, GridItem } from "@chakra-ui/react";
import { RefType } from "react-hotkeys-hook/dist/types";
import { useIntl } from "react-intl";
import { ActionData, DataSamplesPageHint } from "../model";
import ActionDataSamplesCard from "./ActionDataSamplesCard";
import ActionNameCard, { ActionCardNameViewMode } from "./ActionNameCard";
import {
  NameActionHint,
  RecordButtonHint,
  RecordMoreHint,
} from "./DataSamplesTableHints";
import { RecordingOptions } from "./RecordingDialog";

interface DataSamplesTableRowProps {
  preview?: boolean;
  action: ActionData;
  selected: boolean;
  onSelectRow?: () => void;
  onRecord?: (recordingOptions: RecordingOptions) => void;
  hint: DataSamplesPageHint;
  newRecordingId?: number;
  clearNewRecordingId?: () => void;
  onDeleteAction?: () => void;
  renameShortcutScopeRef?: (instance: RefType<HTMLElement>) => void;
}

const DataSamplesTableRow = ({
  action,
  selected,
  onSelectRow,
  onRecord,
  preview,
  hint,
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
            viewMode={
              preview
                ? ActionCardNameViewMode.Preview
                : ActionCardNameViewMode.Editable
            }
          />
        </GridItem>
        {hint === "name-action" && (
          <GridItem h="120px">
            <NameActionHint />
          </GridItem>
        )}
        <GridItem>
          {(action.name.length > 0 || action.recordings.length > 0) && (
            <ActionDataSamplesCard
              preview={preview}
              newRecordingId={newRecordingId}
              value={action}
              selected={selected}
              onSelectRow={onSelectRow}
              onRecord={onRecord}
              clearNewRecordingId={clearNewRecordingId}
            />
          )}
        </GridItem>
        {(hint === "record" || hint === "record-more") && (
          <>
            {/* Skip first column to correctly place hint. */}
            <GridItem />
            <GridItem h="120px">
              {hint === "record" && <RecordButtonHint />}
              {hint === "record-more" && (
                <RecordMoreHint recorded={action.recordings.length} />
              )}
            </GridItem>
          </>
        )}
      </Box>
    </>
  );
};

export default DataSamplesTableRow;
