import {
  Box,
  Button,
  Card,
  CardBody,
  CloseButton,
  HStack,
  keyframes,
  Text,
  VStack,
} from "@chakra-ui/react";
import { useCallback, useRef } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { flags } from "../flags";
import { DataSamplesView, GestureData } from "../model";
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
  const intl = useIntl();
  const deleteGestureRecording = useStore((s) => s.deleteGestureRecording);
  const view = useStore((s) => s.settings.dataSamplesView);
  const closeRecordingDialogFocusRef = useRef(null);

  const handleDeleteRecording = useCallback(
    (idx: number) => {
      deleteGestureRecording(value.ID, idx);
    },
    [value.ID, deleteGestureRecording]
  );

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
      className={tourElClassname.recordDataSamplesCard}
    >
      <CardBody display="flex" flexDirection="row" p={1} gap={3}>
        <VStack w="8.25rem" justifyContent="center">
          <Button
            ref={closeRecordingDialogFocusRef}
            variant={selected ? "solid" : "outline"}
            colorScheme="red"
            onClick={onRecord}
            aria-label={intl.formatMessage(
              { id: "record-action-aria" },
              { action: value.name }
            )}
          >
            <FormattedMessage id="record-action" />
          </Button>
          {value.recordings.length < 3 ? (
            <Text fontSize="xs" textAlign="center" fontWeight="bold">
              <FormattedMessage id="data-samples-status-not-enough" />
            </Text>
          ) : (
            <Text fontSize="xs" textAlign="center">
              <FormattedMessage
                id="data-samples-status-count"
                values={{ numSamples: value.recordings.length }}
              />
            </Text>
          )}
        </VStack>
        {value.recordings.map((recording, idx) => (
          <HStack key={recording.ID} position="relative">
            <Box
              position="absolute"
              h="100%"
              w="100%"
              rounded="md"
              animation={
                newRecordingId === recording.ID ? `${flash} 1s` : undefined
              }
            />
            <CloseButton
              position="absolute"
              top={0}
              right={0}
              zIndex={1}
              size="sm"
              aria-label={intl.formatMessage({
                id: "delete-recording-aria",
              })}
              onClick={() => {
                handleDeleteRecording(idx);
              }}
            />
            {(!flags.fingerprints ||
              view === DataSamplesView.Graph ||
              view === DataSamplesView.GraphAndDataFeatures) && (
              <RecordingGraph
                data={recording.data}
                role="image"
                aria-label={intl.formatMessage({
                  id: "recording-graph-label",
                })}
              />
            )}
            {flags.fingerprints &&
              (view === DataSamplesView.DataFeatures ||
                view === DataSamplesView.GraphAndDataFeatures) && (
                <RecordingFingerprint
                  data={recording.data}
                  role="image"
                  gestureName={value.name}
                  aria-label={intl.formatMessage({
                    id: "recording-fingerprint-label",
                  })}
                />
              )}
          </HStack>
        ))}
      </CardBody>
    </Card>
  );
};

export default ActionDataSamplesCard;
