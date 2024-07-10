import {
  Card,
  CardBody,
  CloseButton,
  GridItem,
  HStack,
  Icon,
  IconButton,
  useDisclosure,
} from "@chakra-ui/react";
import { useIntl } from "react-intl";
import { GestureData, useGestureActions } from "../gestures-hooks";
import RecordIcon from "../images/record-icon.svg?react";
import RecordingGraph from "./RecordingGraph";
import RecordingDialog from "./RecordingDialog";
import { useCallback, useRef } from "react";

interface AddDataGestureRecordingGridItemProps {
  gesture: GestureData;
  selected: boolean;
  onSelectRow?: () => void;
}

const AddDataGestureRecordingGridItem = ({
  gesture,
  selected,
  onSelectRow,
}: AddDataGestureRecordingGridItemProps) => {
  const intl = useIntl();
  const { isOpen, onClose, onOpen: onStartRecording } = useDisclosure();
  const closeRecordingDialogFocusRef = useRef(null);
  const actions = useGestureActions();
  // TODO: Replace with checking if micro:bit is connected
  const isConnected = true;

  const handleDeleteGestureRecording = useCallback(
    (idx: number) => {
      actions.deleteGestureRecording(gesture.ID, idx);
    },
    [actions, gesture.ID]
  );

  return (
    <>
      <RecordingDialog
        gestureId={gesture.ID}
        isOpen={isOpen}
        onClose={onClose}
        actionName={gesture.name}
        finalFocusRef={closeRecordingDialogFocusRef}
      />
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
                onClick={onStartRecording}
                variant="ghost"
                _hover={{ backgroundColor: "transparent" }}
                aria-label={intl.formatMessage(
                  { id: "content.data.recordAction" },
                  { action: gesture.name }
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
            {gesture.recordings.map((recording, idx) => (
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
                    handleDeleteGestureRecording(idx);
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

export default AddDataGestureRecordingGridItem;
