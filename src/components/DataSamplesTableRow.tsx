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
  NameActionWithSamplesHint,
  NameFirstActionHint,
  RecordFirstActionHint,
  RecordHint,
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
        {(hint === "name-first-action" || hint === "name-action") && (
          <GridItem h="120px">
            {hint === "name-first-action" && <NameFirstActionHint />}
            {hint === "name-action" && <NameActionHint />}
          </GridItem>
        )}
        <GridItem position="relative">
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
          {hint === "record-action" && <RecordHint />}
          {hint === "record-more-action" && (
            <RecordMoreHint
              actionName={action.name}
              recorded={action.recordings.length}
            />
          )}
        </GridItem>
        {hint === "name-action-with-samples" && (
          <GridItem h="120px">
            <NameActionWithSamplesHint />
          </GridItem>
        )}
        {hint === "record-first-action" && (
          <>
            {/* Skip first column to correctly place hint. */}
            <GridItem />
            <GridItem h="120px">
              {hint === "record-first-action" && <RecordFirstActionHint />}
            </GridItem>
          </>
        )}
      </Box>
    </>
  );
};

export default DataSamplesTableRow;
