import {
  Card,
  CardBody,
  CloseButton,
  GridItem,
  HStack,
  Icon,
  IconButton,
} from "@chakra-ui/react";
import { useCallback, useRef } from "react";
import { useIntl } from "react-intl";
import { useConnectionStage } from "../connection-stage-hooks";
import RecordIcon from "../images/record-icon.svg?react";
import { GestureData } from "../model";
import { useStore } from "../store";
import { tourElClassname } from "../tours";
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
            <HStack w="8.25rem" justifyContent="center">
              <IconButton
                ref={closeRecordingDialogFocusRef}
                height="fit-content"
                width="fit-content"
                rounded="full"
                onClick={onRecord}
                variant="ghost"
                _hover={{ backgroundColor: "transparent" }}
                aria-label={intl.formatMessage(
                  { id: "content.data.recordAction" },
                  { action: data.name }
                )}
                opacity={isConnected ? 1 : 0.5}
                icon={
                  <Icon
                    as={RecordIcon}
                    boxSize="70px"
                    color={selected ? "red.500" : "black"}
                    opacity={selected ? 1 : 0.2}
                  />
                }
              />
            </HStack>
            {data.recordings.map((recording, idx) => (
              <HStack key={idx} w="158px" position="relative">
                <CloseButton
                  position="absolute"
                  top={0}
                  right={0}
                  size="sm"
                  aria-label={intl.formatMessage({
                    id: "content.data.deleteRecording",
                  })}
                  onClick={() => {
                    handleDeleteRecording(idx);
                  }}
                />
                <RecordingGraph data={recording.data} />
              </HStack>
            ))}
          </CardBody>
        </Card>
      </GridItem>
    </>
  );
};

export default DataRecordingGridItem;
