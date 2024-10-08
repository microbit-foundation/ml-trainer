import {
  Button,
  Grid,
  GridProps,
  Text,
  useDisclosure,
  VStack,
} from "@chakra-ui/react";
import { ButtonEvent } from "@microbit/microbit-connection";
import { ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { useConnectActions } from "../connect-actions-hooks";
import { useConnectionStage } from "../connection-stage-hooks";
import { GestureData } from "../model";
import { useStore } from "../store";
import DataSampleGridRow from "./AddDataGridRow";
import DataSamplesMenu from "./DataSamplesMenu";
import HeadingGrid, { GridColumnHeadingItemProps } from "./HeadingGrid";
import LoadProjectInput, { LoadProjectInputRef } from "./LoadProjectInput";
import RecordingDialog from "./RecordingDialog";
import ConnectToRecordDialog from "./ConnectToRecordDialog";
import { FormattedMessage } from "react-intl";

const gridCommonProps: Partial<GridProps> = {
  gridTemplateColumns: "290px 1fr",
  gap: 3,
  px: 5,
  w: "100%",
};

const headings: GridColumnHeadingItemProps[] = [
  {
    titleId: "content.data.classification",
    descriptionId: "content.data.classHelpBody",
  },
  {
    titleId: "content.data.data",
    descriptionId: "content.data.dataDescription",
    itemsRight: <DataSamplesMenu />,
  },
];

const DataSamplesGridView = () => {
  const gestures = useStore((s) => s.gestures);
  const [selectedGestureIdx, setSelectedGestureIdx] = useState<number>(0);
  const selectedGesture: GestureData | undefined =
    gestures[selectedGestureIdx] ?? gestures[0];

  const showWalkThrough = useMemo<boolean>(
    () =>
      gestures.length === 0 ||
      (gestures.length === 1 && gestures[0].recordings.length === 0),
    [gestures]
  );
  const { isOpen, onClose, onOpen } = useDisclosure();
  const connectToRecordDialogDisclosure = useDisclosure();

  const connection = useConnectActions();
  const { actions } = useConnectionStage();
  const { isConnected } = useConnectionStage();
  const loadProjectInputRef = useRef<LoadProjectInputRef>(null);

  useEffect(() => {
    const listener = (e: ButtonEvent) => {
      if (!isOpen) {
        if (e.state) {
          onOpen();
        }
      }
    };
    connection.addButtonListener("B", listener);
    return () => {
      connection.removeButtonListener("B", listener);
    };
  }, [connection, isOpen, onOpen]);

  return (
    <>
      <ConnectToRecordDialog
        isOpen={connectToRecordDialogDisclosure.isOpen}
        onClose={connectToRecordDialogDisclosure.onClose}
      />
      {selectedGesture && (
        <RecordingDialog
          gestureId={selectedGesture.ID}
          isOpen={isOpen}
          onClose={onClose}
          actionName={selectedGesture.name}
        />
      )}
      <HeadingGrid
        position="sticky"
        top={0}
        {...gridCommonProps}
        headings={headings}
      />
      {gestures.length === 0 ? (
        <VStack
          gap={5}
          flexGrow={1}
          alignItems="center"
          justifyContent="center"
        >
          <LoadProjectInput ref={loadProjectInputRef} accept=".json" />
          <Text fontSize="lg">
            <FormattedMessage id="no-data-samples" />
          </Text>
          {!isConnected && (
            <Text fontSize="lg">
              <FormattedMessage
                id="connect-or-import"
                values={{
                  link1: (chunks: ReactNode) => (
                    <Button
                      fontSize="lg"
                      color="brand.600"
                      variant="link"
                      onClick={actions.startConnect}
                    >
                      {chunks}
                    </Button>
                  ),
                  link2: (chunks: ReactNode) => (
                    <Button
                      fontSize="lg"
                      color="brand.600"
                      variant="link"
                      onClick={() => loadProjectInputRef.current?.chooseFile()}
                    >
                      {chunks}
                    </Button>
                  ),
                }}
              />
            </Text>
          )}
        </VStack>
      ) : (
        <Grid
          {...gridCommonProps}
          alignItems="start"
          autoRows="max-content"
          overflow="auto"
          flexGrow={1}
          h={0}
        >
          {gestures.map((g, idx) => (
            <DataSampleGridRow
              key={g.ID}
              gesture={g}
              selected={selectedGesture.ID === g.ID}
              onSelectRow={() => setSelectedGestureIdx(idx)}
              onRecord={
                isConnected ? onOpen : connectToRecordDialogDisclosure.onOpen
              }
              showWalkThrough={showWalkThrough}
            />
          ))}
        </Grid>
      )}
    </>
  );
};

export default DataSamplesGridView;
