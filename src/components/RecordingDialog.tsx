import {
  Button,
  Heading,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalOverlay,
  Text,
  VStack,
  Box,
} from "@chakra-ui/react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { FormattedMessage, useIntl } from "react-intl";
import { GestureData, useGestureActions } from "../gestures-hooks";
import gestureData from "../test-fixtures/gesture-data.json";
import { MlStage, useMlStatus } from "../ml-status-hooks";

const recordingDuration = 1800;

interface CountdownConfig {
  value: string | number;
  duration: number;
  fontSize?: string;
}

export interface RecordingDialogProps {
  isOpen: boolean;
  onClose: () => void;
  actionName: string;
  gestureId: GestureData["ID"];
}

enum RecordingStatus {
  None,
  Recording,
  Countdown,
}

const RecordingDialog = ({
  isOpen,
  actionName,
  onClose,
  gestureId,
}: RecordingDialogProps) => {
  const intl = useIntl();
  const actions = useGestureActions();
  const [, setStatus] = useMlStatus();
  const [recordingStatus, setRecordingStatus] = useState<RecordingStatus>(
    RecordingStatus.None
  );
  const [countdownIdx, setIsCountdownIdx] = useState<number>(0);

  const countdownConfigs: CountdownConfig[] = useMemo(
    () => [
      { value: 3, duration: 500, fontSize: "8xl" },
      { value: 2, duration: 500, fontSize: "8xl" },
      { value: 1, duration: 500, fontSize: "8xl" },
      {
        value: intl.formatMessage({ id: "content.data.recordingDialog.go" }),
        duration: 1000,
        fontSize: "6xl",
      },
    ],
    [intl]
  );

  const handleOnClose = useCallback(() => {
    setRecordingStatus(RecordingStatus.None);
    setStatus({ stage: MlStage.NotTrained });
    setIsCountdownIdx(0);
    onClose();
  }, [onClose, setStatus]);

  useEffect(() => {
    if (isOpen) {
      // When dialog is opened, restart countdown
      setRecordingStatus(RecordingStatus.Countdown);
      setIsCountdownIdx(0);
    }
  }, [isOpen]);

  useEffect(() => {
    if (recordingStatus === RecordingStatus.Countdown) {
      const config = countdownConfigs[countdownIdx];

      setTimeout(() => {
        if (countdownIdx < countdownConfigs.length - 1) {
          setIsCountdownIdx(countdownIdx + 1);
          return;
        } else {
          setRecordingStatus(RecordingStatus.Recording);
          setStatus({ stage: MlStage.RecordingData });
        }
      }, config.duration);
    }
  }, [countdownConfigs, isOpen, recordingStatus, countdownIdx, setStatus]);

  useEffect(() => {
    if (recordingStatus === RecordingStatus.Recording) {
      setTimeout(() => {
        if (recordingStatus === RecordingStatus.Recording) {
          // TODO: Record samples
          // Stubbing of recording of gesture
          actions.addGestureRecordings(gestureId, [
            (gestureData as GestureData[])[0].recordings[0],
          ]);
          handleOnClose();
        }
      }, recordingDuration);
    }
  }, [actions, gestureId, handleOnClose, recordingStatus]);

  return (
    <Modal
      closeOnOverlayClick={false}
      motionPreset="none"
      isOpen={isOpen}
      onClose={handleOnClose}
      size="lg"
      isCentered
    >
      <ModalOverlay>
        <ModalContent p={8}>
          <ModalBody>
            <ModalCloseButton />
            <VStack width="100%" alignItems="left" gap={5}>
              <Heading as="h1" fontWeight="bold" fontSize="2xl">
                <FormattedMessage
                  id="content.data.recordingDialog.title"
                  values={{ action: actionName }}
                />
              </Heading>
              <VStack height="100px" justifyContent="center">
                {recordingStatus === RecordingStatus.Recording ? (
                  <Text
                    fontSize="5xl"
                    textAlign="center"
                    fontWeight="bold"
                    color="brand.500"
                  >
                    <FormattedMessage id="content.data.recordingDialog.recording" />
                  </Text>
                ) : (
                  <Text
                    fontSize={countdownConfigs[countdownIdx].fontSize}
                    textAlign="center"
                    fontWeight="bold"
                    color="brand.500"
                  >
                    {countdownConfigs[countdownIdx].value}
                  </Text>
                )}
              </VStack>
              <Box
                alignSelf="center"
                w="280px"
                h="24px"
                bgColor="red.200"
                rounded="full"
                overflow="hidden"
              >
                <Box
                  as={motion.div}
                  height="100%"
                  width={0}
                  bg="red.500"
                  animate={
                    recordingStatus === RecordingStatus.Recording
                      ? { width: [0, 280] }
                      : undefined
                  }
                  transition="1.5s linear"
                />
              </Box>
              <Button
                variant="warning"
                width="fit-content"
                alignSelf="center"
                onClick={handleOnClose}
              >
                <FormattedMessage id="content.data.recording.button.cancel" />
              </Button>
            </VStack>
          </ModalBody>
        </ModalContent>
      </ModalOverlay>
    </Modal>
  );
};

export default RecordingDialog;
