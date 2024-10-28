import {
  Box,
  Button,
  Card,
  CardBody,
  CloseButton,
  GridItem,
  HStack,
  Text,
  VStack,
} from "@chakra-ui/react";
import { useCallback, useRef } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { flags } from "../../flags";
import { DataSamplesView, GestureData } from "../../model";
import { useStore } from "../../store";
import { tourElClassname } from "../../tours";
import RecordingFingerprint from "../RecordingFingerprint";
import RecordingGraph from "../RecordingGraph";
import styles from "./styles.module.css";

interface DataRecordingGridItemProps {
  data: GestureData;
  selected: boolean;
  onSelectRow?: () => void;
  onRecord: () => void;
  newRecordingId?: number;
}

const DataRecordingGridItem = ({
  data,
  selected,
  onSelectRow,
  onRecord,
  newRecordingId,
}: DataRecordingGridItemProps) => {
  const intl = useIntl();
  const deleteGestureRecording = useStore((s) => s.deleteGestureRecording);
  const view = useStore((s) => s.settings.dataSamplesView);
  const closeRecordingDialogFocusRef = useRef(null);

  const handleDeleteRecording = useCallback(
    (idx: number) => {
      deleteGestureRecording(data.ID, idx);
    },
    [data.ID, deleteGestureRecording]
  );

  return (
    <>
      <GridItem>
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
                  { action: data.name }
                )}
              >
                <FormattedMessage id="record-action" />
              </Button>
              {data.recordings.length < 3 ? (
                <Text fontSize="xs" textAlign="center" fontWeight="bold">
                  <FormattedMessage id="data-samples-status-not-enough" />
                </Text>
              ) : (
                <Text fontSize="xs" textAlign="center">
                  <FormattedMessage
                    id="data-samples-status-count"
                    values={{ numSamples: data.recordings.length }}
                  />
                </Text>
              )}
            </VStack>
            {data.recordings.map((recording, idx) => (
              <HStack key={recording.ID} position="relative">
                <Box
                  position="absolute"
                  h="100%"
                  w="100%"
                  rounded="md"
                  className={
                    newRecordingId === recording.ID
                      ? styles["flash-animation"]
                      : undefined
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
                      gestureName={data.name}
                      aria-label={intl.formatMessage({
                        id: "recording-fingerprint-label",
                      })}
                    />
                  )}
              </HStack>
            ))}
          </CardBody>
        </Card>
      </GridItem>
    </>
  );
};

export default DataRecordingGridItem;
