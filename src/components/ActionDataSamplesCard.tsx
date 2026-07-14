/**
 * (c) 2024, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { forwardRef, ReactNode, useCallback, useState } from "react";
import { createPortal } from "react-dom";
import { RiHashtag, RiTimerLine } from "react-icons/ri";
import { FormattedMessage, useIntl } from "react-intl";
import { ActionData, DataSamplesView, RecordingData } from "../model";
import {
  Box,
  Button,
  ButtonGroup,
  CardBody,
  CloseButton,
  css,
  cx,
  HStack,
  Icon,
  MenuItem,
  MenuList,
  MenuTrigger,
  Text,
  VStack,
} from "../shared-ui";
import RowCard from "./RowCard";
import { useStore } from "../store";
import { tourElClassname } from "../tours";
import MoreMenuButton from "./MoreMenuButton";
import { RecordingOptions } from "./RecordingDialog";
import RecordingFingerprint from "./RecordingFingerprint";
import RecordingGraph from "./RecordingGraph";

interface ActionDataSamplesCardProps {
  preview?: boolean;
  value: ActionData;
  selected: boolean;
  onSelectRow?: () => void;
  onRecord?: (recordingOptions: RecordingOptions) => void;
  newRecordingId?: string;
  clearNewRecordingId?: () => void;
}

const ActionDataSamplesCard = ({
  value,
  selected,
  onSelectRow,
  onRecord,
  newRecordingId,
  clearNewRecordingId,
  preview,
}: ActionDataSamplesCardProps) => {
  const intl = useIntl();
  const deleteActionRecording = useStore((s) => s.deleteActionRecording);
  const settingsDataSamplesView = useStore((s) => s.settings.dataSamplesView);
  const view = preview ? DataSamplesView.Graph : settingsDataSamplesView;
  if (view === DataSamplesView.GraphAndDataFeatures) {
    // We split the cards in this case
    return (
      <HStack>
        {onRecord && (
          <DataSamplesRowCard
            onSelectRow={onSelectRow}
            selected={selected}
            className={cx(
              css({ position: "relative" }),
              tourElClassname.recordDataSamplesCard
            )}
          >
            <RecordingArea
              action={value}
              selected={selected}
              onRecord={onRecord}
            />
          </DataSamplesRowCard>
        )}
        {value.recordings.map((recording, idx) => (
          <GraphAndDataFeaturesDataSampleCard
            onSelectRow={onSelectRow}
            selected={selected}
            key={recording.id}
            closeButton={
              <CloseButton
                aria-label={intl.formatMessage(
                  {
                    id: "delete-recording-aria",
                  },
                  {
                    sample: value.recordings.length - idx,
                    numSamples: value.recordings.length,
                    action: value.name,
                  }
                )}
                onClick={() => deleteActionRecording(value.id, recording.id)}
                expandHitArea
                css={{
                  position: "absolute",
                  top: -2,
                  right: -2,
                  borderRadius: "full",
                  bg: "white",
                  borderColor: "blackAlpha.500",
                  boxShadow: "sm",
                  // Solid hover/active: this button floats over the card
                  // edge, so the default translucent hover lets the content
                  // beneath show through it.
                  _hover: { bg: "gray.100" },
                  _active: { bg: "gray.200" },
                }}
              />
            }
          >
            <DataSample
              recording={recording}
              numRecordings={value.recordings.length}
              actionId={value.id}
              actionName={value.name}
              recordingIndex={idx}
              isNew={newRecordingId === recording.id}
              onNewAnimationEnd={clearNewRecordingId}
              onDelete={deleteActionRecording}
              view={view}
              hasClose={false}
            />
          </GraphAndDataFeaturesDataSampleCard>
        ))}
      </HStack>
    );
  }
  return (
    <DataSamplesRowCard
      onSelectRow={onSelectRow}
      selected={selected}
      variant={preview ? "outline" : undefined}
      // Otherwise we put the tour class on the recording area
      className={
        value.recordings.length === 0
          ? tourElClassname.recordDataSamplesCard
          : undefined
      }
    >
      {!!onRecord && (
        <RecordingArea
          className={tourElClassname.recordDataSamplesCard}
          action={value}
          selected={selected}
          onRecord={onRecord}
        />
      )}
      {value.recordings.map((recording, idx) => (
        <DataSample
          key={recording.id}
          actionId={value.id}
          actionName={value.name}
          recordingIndex={idx}
          hasClose={!preview}
          recording={recording}
          numRecordings={value.recordings.length}
          isNew={newRecordingId === recording.id}
          onDelete={deleteActionRecording}
          onNewAnimationEnd={clearNewRecordingId}
          view={view}
        />
      ))}
    </DataSamplesRowCard>
  );
};

interface GraphAndDataFeaturesDataSampleCardProps
  extends DataSamplesRowCardProps {
  children: ReactNode;
  closeButton: ReactNode;
}

const GraphAndDataFeaturesDataSampleCard = ({
  children,
  closeButton,
  ...props
}: GraphAndDataFeaturesDataSampleCardProps) => {
  // State, not a ref: the portal target must trigger a re-render once mounted.
  // Portaling appends the close button after the card content so it paints
  // above the recording graph.
  const [target, setTarget] = useState<HTMLDivElement | null>(null);
  return (
    <DataSamplesRowCard {...props} ref={setTarget}>
      {target && createPortal(closeButton, target)}
      {children}
    </DataSamplesRowCard>
  );
};

interface DataSamplesRowCardProps {
  selected: boolean;
  onSelectRow?: () => void;
  children: ReactNode;
  variant?: "elevated" | "outline";
  className?: string;
}

const DataSamplesRowCard = forwardRef<HTMLDivElement, DataSamplesRowCardProps>(
  function DataSamplesRowCard(
    { selected, onSelectRow, children, variant, className },
    ref
  ) {
    return (
      <RowCard
        ref={ref}
        onClick={onSelectRow}
        variant={variant}
        selected={selected}
        css={{ width: "fit-content" }}
        className={className}
      >
        <CardBody
          css={{
            display: "flex",
            flexDirection: "row",
            px: 1,
            py: 1,
            gap: 3,
          }}
        >
          {children}
        </CardBody>
      </RowCard>
    );
  }
);

interface RecordingAreaProps {
  action: ActionData;
  selected: boolean;
  onRecord: (recordingOptions: RecordingOptions) => void;
  className?: string;
}

export const recordButtonId = (action: ActionData) =>
  `record-button-${action.id}`;

const RecordingArea = ({
  action,
  selected,
  onRecord,
  className,
}: RecordingAreaProps) => {
  const intl = useIntl();
  return (
    <VStack w="8.25rem" justifyContent="center" className={className}>
      <ButtonGroup isAttached>
        <Button
          id={recordButtonId(action)}
          variant={selected ? "record" : "recordOutline"}
          onPress={() =>
            onRecord({ recordingsToCapture: 1, continuousRecording: false })
          }
          aria-label={intl.formatMessage(
            { id: "record-action-aria" },
            { action: action.name }
          )}
          css={{ pr: 2, borderRight: "none" }}
        >
          <FormattedMessage id="record-action" />
        </Button>
        <MenuTrigger>
          <MoreMenuButton
            css={{ minW: 8 }}
            variant={selected ? "record" : "recordOutline"}
            aria-label={intl.formatMessage(
              { id: "recording-options-aria" },
              { action: action.name }
            )}
          />
          <MenuList>
            <MenuItem
              onAction={() =>
                onRecord({
                  recordingsToCapture: 10,
                  continuousRecording: false,
                })
              }
              icon={<Icon as={RiHashtag} css={{ width: 5, height: 5 }} />}
              textValue={intl.formatMessage(
                { id: "record-samples" },
                { numSamples: 10 }
              )}
            >
              <Text fontSize="md">
                <FormattedMessage
                  id="record-samples"
                  values={{ numSamples: 10 }}
                />
              </Text>
              <Text fontSize="xs">
                <FormattedMessage id="record-samples-help" />
              </Text>
            </MenuItem>
            <MenuItem
              onAction={() =>
                onRecord({
                  recordingsToCapture: 10,
                  continuousRecording: true,
                })
              }
              icon={<Icon as={RiTimerLine} css={{ width: 5, height: 5 }} />}
              textValue={intl.formatMessage(
                { id: "record-seconds" },
                { numSeconds: 10 }
              )}
            >
              <Text fontSize="md">
                <FormattedMessage
                  id="record-seconds"
                  values={{ numSeconds: 10 }}
                />
              </Text>
              <Text fontSize="xs">
                <FormattedMessage
                  id="record-seconds-help"
                  values={{ numSamples: 10 }}
                />
              </Text>
            </MenuItem>
          </MenuList>
        </MenuTrigger>
      </ButtonGroup>
      {action.recordings.length < 3 ? (
        <Text
          fontSize="xs"
          textAlign="center"
          fontWeight="bold"
          userSelect="none"
        >
          <FormattedMessage id="data-samples-status-not-enough" />
        </Text>
      ) : (
        <Text fontSize="xs" textAlign="center" userSelect="none">
          <FormattedMessage
            id="data-samples-status-count"
            values={{ numSamples: action.recordings.length }}
          />
        </Text>
      )}
    </VStack>
  );
};

const DataSample = ({
  recording,
  numRecordings,
  actionId,
  actionName,
  recordingIndex,
  isNew,
  onNewAnimationEnd,
  onDelete,
  view,
  hasClose = true,
}: {
  recording: RecordingData;
  numRecordings: number;
  actionId: string;
  actionName: string;
  recordingIndex: number;
  isNew: boolean;
  onNewAnimationEnd?: () => void;
  onDelete: (actionId: string, recordingId: string) => void;
  view: DataSamplesView;
  hasClose?: boolean;
}) => {
  const hasGraph =
    view === DataSamplesView.Graph ||
    view === DataSamplesView.GraphAndDataFeatures;
  const hasFingerprint =
    view === DataSamplesView.DataFeatures ||
    view === DataSamplesView.GraphAndDataFeatures;
  const intl = useIntl();
  const handleDelete = useCallback(() => {
    onDelete(actionId, recording.id);
  }, [actionId, onDelete, recording.id]);
  return (
    <HStack
      key={recording.id}
      position="relative"
      gap={hasFingerprint && hasGraph ? 2 : 0}
    >
      {hasClose && (
        <CloseButton
          size="sm"
          aria-label={intl.formatMessage(
            {
              id: "delete-recording-aria",
            },
            {
              sample: numRecordings - recordingIndex,
              numSamples: numRecordings,
              action: actionName,
            }
          )}
          onClick={handleDelete}
          expandHitArea
          css={{
            position: "absolute",
            top: 0,
            right: 0,
            // Paint above the graph/fingerprint siblings that follow it.
            zIndex: 1,
          }}
        />
      )}
      {hasGraph && (
        <RecordingGraph
          data={recording.data}
          role="img"
          aria-label={intl.formatMessage({
            id: "recording-graph-label",
          })}
        >
          <Box
            position="absolute"
            top={0}
            bottom={0}
            left={0}
            right={0}
            rounded="md"
            className={
              isNew ? css({ animation: "recordingFlash 1s" }) : undefined
            }
            onAnimationEnd={onNewAnimationEnd}
          />
        </RecordingGraph>
      )}
      {hasFingerprint && (
        <RecordingFingerprint
          size={view === DataSamplesView.GraphAndDataFeatures ? "sm" : "md"}
          data={recording.data}
          role="img"
          aria-label={intl.formatMessage({
            id: "recording-fingerprint-label",
          })}
        />
      )}
    </HStack>
  );
};

export default ActionDataSamplesCard;
