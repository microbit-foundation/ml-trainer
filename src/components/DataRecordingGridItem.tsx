import {
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
import { useConnectionStage } from "../connection-stage-hooks";
import { flags } from "../flags";
import { DataSamplesView, GestureData } from "../model";
import { useStore } from "../store";
import { tourElClassname } from "../tours";
import RecordingFingerprint from "./RecordingFingerprint";
import RecordingGraph from "./RecordingGraph";

interface DataRecordingGridItemProps {
  data: GestureData;
  selected: boolean;
  onSelectRow?: () => void;
  onRecord: () => void;
}

const DataRecordingGridItem = ({
  data,
  selected,
  onSelectRow,
  onRecord,
}: DataRecordingGridItemProps) => {
  const intl = useIntl();
  const deleteGestureRecording = useStore((s) => s.deleteGestureRecording);
  const view = useStore((s) => s.settings.dataSamplesView);
  const closeRecordingDialogFocusRef = useRef(null);
  const { isConnected } = useConnectionStage();

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
                rounded="full"
                variant="solid"
                textColor={selected ? "white" : "black"}
                backgroundColor={selected ? "red.500" : "blackAlpha.200"}
                onClick={onRecord}
                _hover={{
                  backgroundColor: selected ? "red.600" : "blackAlpha.100",
                }}
                aria-label={intl.formatMessage(
                  { id: "record-action-aria" },
                  { action: data.name }
                )}
                opacity={!isConnected ? 0.5 : 1}
              >
                <FormattedMessage id="record-action" />
              </Button>
            </VStack>
            {data.recordings.map((recording, idx) => (
              <HStack key={idx} position="relative">
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
