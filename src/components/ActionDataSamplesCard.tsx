import {
  Box,
  Button,
  ButtonGroup,
  Card,
  CardBody,
  CloseButton,
  HStack,
  keyframes,
  Menu,
  MenuItem,
  MenuList,
  Portal,
  Text,
  VStack,
} from "@chakra-ui/react";
import { FormattedMessage, useIntl } from "react-intl";
import { flags } from "../flags";
import { DataSamplesView, GestureData, RecordingData } from "../model";
import { useStore } from "../store";
import { tourElClassname } from "../tours";
import RecordingFingerprint from "./RecordingFingerprint";
import RecordingGraph from "./RecordingGraph";
import MoreMenuButton from "./MoreMenuButton";

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
  onRecord: (recordingsToCapture: number, continuousRecording: boolean) => void;
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
        <RecordingArea action={value} selected={selected} onRecord={onRecord} />
        {value.recordings.map((recording, idx) => (
          <DataSample
            action={value}
            key={recording.ID}
            recording={recording}
            isNew={newRecordingId === recording.ID}
            onDelete={() => deleteGestureRecording(value.ID, idx)}
            view={view}
          />
        ))}
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
  onRecord: (recordingsToCapture: number, continuousRecording: boolean) => void;
}) => {
  const intl = useIntl();
  return (
    <VStack w="8.25rem" justifyContent="center">
      <Menu>
        <ButtonGroup isAttached>
          <Button
            variant={selected ? "solid" : "outline"}
            colorScheme="red"
            onClick={() => onRecord(1, false)}
            aria-label={intl.formatMessage(
              { id: "record-action-aria" },
              { action: action.name }
            )}
          >
            <FormattedMessage id="record-action" />
          </Button>
          <MoreMenuButton
            variant={selected ? "primary" : "secondary"}
            aria-label="More record options"
          />
          <Portal>
            <MenuList>
              <MenuItem onClick={() => onRecord(3, false)}>
                Record 3 samples
              </MenuItem>
              <MenuItem onClick={() => onRecord(10, false)}>
                Record 10 samples
              </MenuItem>
              <MenuItem onClick={() => onRecord(30, true)}>
                Record for 30 seconds
              </MenuItem>
            </MenuList>
          </Portal>
        </ButtonGroup>
      </Menu>
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
  action,
  recording,
  isNew,
  onDelete,
  view,
}: {
  action: GestureData;
  recording: RecordingData;
  isNew: boolean;
  onDelete: () => void;
  view: DataSamplesView;
}) => {
  const intl = useIntl();
  return (
    <HStack key={recording.ID} position="relative">
      <Box
        position="absolute"
        h="100%"
        w="100%"
        rounded="md"
        animation={isNew ? `${flash} 1s` : undefined}
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
        onClick={onDelete}
      />
      {(view === DataSamplesView.Graph ||
        view === DataSamplesView.GraphAndDataFeatures) && (
        <RecordingGraph
          data={recording.data}
          role="image"
          aria-label={intl.formatMessage({
            id: "recording-graph-label",
          })}
        />
      )}
      {(view === DataSamplesView.DataFeatures ||
        view === DataSamplesView.GraphAndDataFeatures) && (
        <RecordingFingerprint
          data={recording.data}
          role="image"
          gestureName={action.name}
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
