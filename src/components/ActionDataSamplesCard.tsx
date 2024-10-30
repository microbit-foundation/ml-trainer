import {
  Box,
  BoxProps,
  Button,
  Card,
  CardBody,
  CloseButton,
  HStack,
  keyframes,
  Text,
  VStack,
} from "@chakra-ui/react";
import { ReactNode, useCallback } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { flags } from "../flags";
import { DataSamplesView, GestureData, RecordingData } from "../model";
import { useStore } from "../store";
import { tourElClassname } from "../tours";
import RecordingFingerprint from "./RecordingFingerprint";
import RecordingGraph from "./RecordingGraph";

const flash = keyframes({
  "0%, 10%": {
    backgroundColor: "#4040ff44",
  },
  "100%": {},
});

interface ActionDataSamplesCardProps {
  value: GestureData;
  selected: boolean;
  onSelectRow?: () => void;
  onRecord: () => void;
  newRecordingId?: number;
}

const ActionDataSamplesCard = ({
  value,
  selected,
  onSelectRow,
  onRecord,
  newRecordingId,
}: ActionDataSamplesCardProps) => {
  const deleteGestureRecording = useStore((s) => s.deleteGestureRecording);
  const view = useDataSamplesView();
  if (view === DataSamplesView.GraphAndDataFeatures) {
    // We split the cards in this case
    return (
      <HStack>
        <DataSamplesRowCard
          onSelectRow={onSelectRow}
          selected={selected}
          position="relative"
          className={tourElClassname.recordDataSamplesCard}
        >
          <RecordingArea
            action={value}
            selected={selected}
            onRecord={onRecord}
          />
        </DataSamplesRowCard>
        {value.recordings.map((recording, idx) => (
          <DataSamplesRowCard
            onSelectRow={onSelectRow}
            selected={selected}
            key={recording.ID}
          >
            <CloseButton
              position="absolute"
              top={-2}
              right={-2}
              rounded="full"
              bgColor="white"
              zIndex={1}
              borderColor="blackAlpha.500"
              boxShadow="sm"
              onClick={() => deleteGestureRecording(value.ID, idx)}
            />
            <DataSample
              recording={recording}
              actionId={value.ID}
              recordingIndex={idx}
              isNew={newRecordingId === recording.ID}
              onDelete={deleteGestureRecording}
              view={view}
              hasClose={false}
            />
          </DataSamplesRowCard>
        ))}
      </HStack>
    );
  }
  return (
    <DataSamplesRowCard
      onSelectRow={onSelectRow}
      selected={selected}
      className={tourElClassname.recordDataSamplesCard}
    >
      <RecordingArea action={value} selected={selected} onRecord={onRecord} />
      {value.recordings.map((recording, idx) => (
        <DataSample
          key={recording.ID}
          actionId={value.ID}
          recordingIndex={idx}
          recording={recording}
          isNew={newRecordingId === recording.ID}
          onDelete={deleteGestureRecording}
          view={view}
        />
      ))}
    </DataSamplesRowCard>
  );
};

interface DataSamplesRowCardProps extends BoxProps {
  selected: boolean;
  onSelectRow?: () => void;
  children: ReactNode;
}

const DataSamplesRowCard = ({
  selected,
  onSelectRow,
  children,
  ...rest
}: DataSamplesRowCardProps) => {
  return (
    <Card
      onClick={onSelectRow}
      p={2}
      h="120px"
      display="flex"
      flexDirection="row"
      width="fit-content"
      borderColor={selected ? "brand.500" : "transparent"}
      borderWidth={1}
      {...rest}
    >
      <CardBody display="flex" flexDirection="row" p={1} gap={3}>
        {children}
      </CardBody>
    </Card>
  );
};

const RecordingArea = ({
  action,
  selected,
  onRecord,
}: {
  action: GestureData;
  selected: boolean;
  onRecord: () => void;
}) => {
  const intl = useIntl();
  return (
    <VStack w="8.25rem" justifyContent="center">
      <Button
        variant={selected ? "solid" : "outline"}
        colorScheme="red"
        onClick={onRecord}
        aria-label={intl.formatMessage(
          { id: "record-action-aria" },
          { action: action.name }
        )}
      >
        <FormattedMessage id="record-action" />
      </Button>
      {action.recordings.length < 3 ? (
        <Text fontSize="xs" textAlign="center" fontWeight="bold">
          <FormattedMessage id="data-samples-status-not-enough" />
        </Text>
      ) : (
        <Text fontSize="xs" textAlign="center">
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
  actionId,
  recordingIndex,
  isNew,
  onDelete,
  view,
  hasClose = true,
}: {
  recording: RecordingData;
  actionId: number;
  recordingIndex: number;
  isNew: boolean;
  onDelete: (gestureId: GestureData["ID"], recordingIdx: number) => void;
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
    onDelete(actionId, recordingIndex);
  }, [actionId, onDelete, recordingIndex]);
  return (
    <HStack key={recording.ID} position="relative">
      {hasClose && (
        <CloseButton
          position="absolute"
          top={0}
          right={0}
          zIndex={1}
          size="sm"
          aria-label={intl.formatMessage({
            id: "delete-recording-aria",
          })}
          onClick={handleDelete}
        />
      )}
      {hasGraph && (
        <RecordingGraph
          data={recording.data}
          role="image"
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
            animation={isNew ? `${flash} 1s` : undefined}
          />
        </RecordingGraph>
      )}
      {hasFingerprint && (
        <RecordingFingerprint
          size={view === DataSamplesView.GraphAndDataFeatures ? "sm" : "md"}
          data={recording.data}
          role="image"
          aria-label={intl.formatMessage({
            id: "recording-fingerprint-label",
          })}
        />
      )}
    </HStack>
  );
};

const useDataSamplesView = () => {
  const storeView = useStore((s) => s.settings.dataSamplesView);
  return flags.fingerprints ? storeView : DataSamplesView.Graph;
};

export default ActionDataSamplesCard;
