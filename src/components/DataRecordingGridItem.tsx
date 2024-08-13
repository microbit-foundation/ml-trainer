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
import { GestureData, useGestureActions } from "../gestures-hooks";
import RecordIcon from "../images/record-icon.svg?react";
import RecordingGraph from "./RecordingGraph";

interface DataRecordingGridItemProps {
  data: GestureData;
  selected: boolean;
  onSelectRow?: () => void;
  startRecording: () => void;
}

const DataRecordingGridItem = ({
  data,
  selected,
  onSelectRow,
  startRecording,
}: DataRecordingGridItemProps) => {
  const intl = useIntl();
  const closeRecordingDialogFocusRef = useRef(null);
  const actions = useGestureActions();
  const { isConnected } = useConnectionStage();

  const handleDeleteRecording = useCallback(
    (idx: number) => {
      actions.deleteGestureRecording(data.ID, idx);
    },
    [actions, data.ID]
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
        >
          <CardBody display="flex" flexDirection="row" p={1} gap={3}>
            <HStack w="8.25rem" justifyContent="center">
              <IconButton
                ref={closeRecordingDialogFocusRef}
                height="fit-content"
                width="fit-content"
                rounded="full"
                onClick={startRecording}
                variant="ghost"
                _hover={{ backgroundColor: "transparent" }}
                aria-label={intl.formatMessage(
                  { id: "content.data.recordAction" },
                  { action: data.name }
                )}
                isDisabled={!isConnected}
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