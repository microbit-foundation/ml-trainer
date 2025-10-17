/**
 * (c) 2023, Center for Computational Thinking and Design at Aarhus University and contributors
 * Modifications (c) 2024, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { Box, GridItem } from "@chakra-ui/react";
import { RefType } from "react-hotkeys-hook/dist/types";
import { useIntl } from "react-intl";
import { ActionData } from "../model";
import ActionDataSamplesCard from "./ActionDataSamplesCard";
import ActionNameCard, { ActionCardNameViewMode } from "./ActionNameCard";
import { NameActionHint, RecordButtonHint } from "./DataSamplesTableHints";
import { RecordingOptions } from "./RecordingDialog";

interface DataSamplesTableRowProps {
  preview?: boolean;
  action: ActionData;
  actions: ActionData[];
  selected: boolean;
  onSelectRow?: () => void;
  onRecord?: (recordingOptions: RecordingOptions) => void;
  showHints: boolean;
  newRecordingId?: number;
  clearNewRecordingId?: () => void;
  onDeleteAction?: () => void;
  renameShortcutScopeRef?: (instance: RefType<HTMLElement>) => void;
}

const DataSamplesTableRow = ({
  action,
  actions,
  selected,
  onSelectRow,
  onRecord,
  preview,
  showHints,
  newRecordingId,
  clearNewRecordingId,
  onDeleteAction,
  renameShortcutScopeRef,
}: DataSamplesTableRowProps) => {
  const intl = useIntl();
  const needsNameHint =
    actions.length === 1 &&
    action.name.length === 0 &&
    action.recordings.length === 0;
  const needsRecordHint =
    !needsNameHint && actions.length === 1 && action.recordings.length === 0;
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
        {showHints && needsNameHint && <NameActionHint />}
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
        {showHints && needsRecordHint && (
          <>
            {/* Skip first column to correctly place hint. */}
            <GridItem />
            <RecordButtonHint />
          </>
        )}
      </Box>
    </>
  );
};

export default DataSamplesTableRow;
