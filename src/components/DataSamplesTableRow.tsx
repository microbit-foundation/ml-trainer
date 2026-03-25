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
  RecordHint,
  RecordMoreHint,
} from "./DataSamplesTableHints";
import { RecordingOptions } from "./RecordingDialog";

interface DataSamplesTableRowProps {
  actionNum: number;
  isLastRow: boolean;
  preview?: boolean;
  action: ActionData;
  selected: boolean;
  onSelectRow?: () => void;
  onRecord?: (recordingOptions: RecordingOptions) => void;
  hint: DataSamplesPageHint;
  newRecordingId?: string;
  clearNewRecordingId?: () => void;
  onDeleteAction?: () => void;
  renameShortcutScopeRef?: (instance: RefType<HTMLElement>) => void;
}

const DataSamplesTableRow = ({
  actionNum,
  isLastRow,
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
      {hint?.type === "name-action" && hint.actionNum === actionNum && (
        <GridItem h="120px">
          {hint?.actionNum === 1 && <NameFirstActionHint />}
          {hint?.actionNum === 2 && <NameActionHint />}
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
        {hint?.type === "record-action" && hint.actionNum === actionNum && (
          <RecordHint />
        )}
        {hint?.type === "record-more-action" && isLastRow && (
          <RecordMoreHint
            actionName={action.name}
            recorded={action.recordings.length}
          />
        )}
      </GridItem>
      {hint?.type === "name-action-with-samples" && isLastRow && (
        <GridItem h="120px">
          <NameActionWithSamplesHint />
        </GridItem>
      )}
    </Box>
  );
};

export default DataSamplesTableRow;
