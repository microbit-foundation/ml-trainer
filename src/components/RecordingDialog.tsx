import {
  Button,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Progress,
  Text,
  useToast,
  VStack,
} from "@chakra-ui/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { TimedXYZ } from "../buffered-data";
import { useBufferedData } from "../buffered-data-hooks";
import { GestureData, XYZData } from "../model";
import { useStore } from "../store";

interface CountdownStage {
  value: string | number;
  duration: number;
  fontSize?: string;
}

export interface RecordingDialogProps {
  isOpen: boolean;
  onClose: () => void;
  actionName: string;
  gestureId: GestureData["ID"];
  onRecordingComplete: (recordingId: number) => void;
  recordingsToCapture: number;
  continuousRecording: boolean;
}

enum RecordingStatus {
  None,
  Recording,
  Countdown,
  Done,
}

const RecordingDialog = ({
  isOpen,
  actionName,
  onClose,
  gestureId,
  onRecordingComplete,
  recordingsToCapture,
  continuousRecording,
}: RecordingDialogProps) => {
  const intl = useIntl();
  const toast = useToast();
  const recordingStarted = useStore((s) => s.recordingStarted);
  const recordingStopped = useStore((s) => s.recordingStopped);
  const addGestureRecordings = useStore((s) => s.addGestureRecordings);
  const recordingDataSource = useRecordingDataSource();
  const [recordingStatus, setRecordingStatus] = useState<RecordingStatus>(
    RecordingStatus.None
  );
  const countdownStages: CountdownStage[] = useMemo(
    () => [
      { value: 3, duration: 500, fontSize: "8xl" },
      { value: 2, duration: 500, fontSize: "8xl" },
      { value: 1, duration: 500, fontSize: "8xl" },
      {
        value: intl.formatMessage({ id: "go-action" }),
        duration: 1000,
        fontSize: "6xl",
      },
    ],
    [intl]
  );
  const [countdownStageIndex, setCountdownStageIndex] = useState<number>(0);
  const [recordingsRemaining, setRecordingsRemaining] =
    useState<number>(recordingsToCapture);

  const handleCleanup = useCallback(() => {
    recordingStopped();
    setRecordingStatus(RecordingStatus.None);
    setCountdownStageIndex(0);
    setProgress(0);
    setRunningContinuously(false);
    onClose();
    setRecordingsRemaining(-2);
  }, [onClose, recordingStopped]);

  const handleOnClose = useCallback(() => {
    recordingDataSource.cancelRecording();
    handleCleanup();
  }, [handleCleanup, recordingDataSource]);

  const startRecording = useCallback(() => {
    setRecordingsRemaining((prev) => prev - 1);
    recordingStopped();
    setRecordingStatus(RecordingStatus.Countdown);
    setCountdownStageIndex(0);
    setProgress(0);
  }, [recordingStopped]);

  const [runningContinuously, setRunningContinuously] =
    useState<boolean>(false);
  const continueRecording = useCallback(() => {
    setProgress(0);
    setRunningContinuously(true);
    setRecordingsRemaining((prev) => prev - 1);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setRecordingsRemaining(recordingsToCapture);
      // When dialog is opened, restart countdown
      startRecording();
    }
  }, [isOpen, recordingsToCapture, startRecording]);

  const [progress, setProgress] = useState(0);
  const doneTimeout = useRef<NodeJS.Timeout>();
  useEffect(() => {
    if (recordingStatus === RecordingStatus.Countdown) {
      const config = countdownStages[countdownStageIndex];

      const countdownTimeout = setTimeout(() => {
        if (countdownStageIndex < countdownStages.length - 1) {
          setCountdownStageIndex(countdownStageIndex + 1);
          return;
        } else {
          setRecordingStatus(RecordingStatus.Recording);
          recordingStarted();
          recordingDataSource.startRecording({
            onDone(data) {
              const recordingId = Date.now();
              addGestureRecordings(gestureId, [{ ID: recordingId, data }]);
              if (continuousRecording) {
                continueRecording();
              } else if (recordingsRemaining) {
                startRecording();
              } else {
                setRecordingsRemaining((prev) => prev - 1);
                setRecordingStatus(RecordingStatus.Done);
                doneTimeout.current = setTimeout(() => {
                  handleCleanup();
                  onRecordingComplete(recordingId);
                }, 1000);
              }
            },
            onError() {
              handleCleanup();

              toast({
                position: "top",
                duration: 5_000,
                title: intl.formatMessage({
                  id: "disconnected-during-recording",
                }),
                variant: "subtle",
                status: "error",
              });
            },
            onProgress: setProgress,
          });
        }
      }, config.duration);
      return () => {
        clearTimeout(countdownTimeout);
        doneTimeout.current && clearTimeout(doneTimeout.current);
      };
    } else if (runningContinuously) {
      recordingDataSource.startRecording({
        onDone(data) {
          const recordingId = Date.now();
          addGestureRecordings(gestureId, [{ ID: recordingId, data }]);
          if (recordingsRemaining) {
            continueRecording();
          } else {
            setRunningContinuously(false);
            setRecordingsRemaining((prev) => prev - 1);
            setRecordingStatus(RecordingStatus.Done);
            doneTimeout.current = setTimeout(() => {
              handleCleanup();
              onRecordingComplete(recordingId);
            }, 1000);
          }
        },
        onError() {
          handleCleanup();

          toast({
            position: "top",
            duration: 5_000,
            title: intl.formatMessage({
              id: "disconnected-during-recording",
            }),
            variant: "subtle",
            status: "error",
          });
        },
        onProgress: setProgress,
      });
    }
  }, [
    countdownStages,
    isOpen,
    recordingStatus,
    countdownStageIndex,
    recordingDataSource,
    gestureId,
    handleOnClose,
    handleCleanup,
    toast,
    intl,
    recordingStarted,
    addGestureRecordings,
    onRecordingComplete,
    startRecording,
    recordingsToCapture,
    recordingsRemaining,
    continuousRecording,
    continueRecording,
    runningContinuously,
  ]);

  const recordingsRemaingTextValue = useMemo(() => {
    // A bit of a fiddle to show the correct number of recordings remaining
    // without having the initial figures change just after the dialog opens
    const recordingsRemainingVal = recordingsRemaining + 1;
    return recordingsRemaining !== -2 &&
      recordingsRemainingVal < recordingsToCapture
      ? recordingsRemainingVal
      : recordingsToCapture;
  }, [recordingsRemaining, recordingsToCapture]);

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
        <ModalContent>
          <ModalHeader>
            <FormattedMessage
              id="recording-data-for"
              values={{ action: actionName }}
            />
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack width="100%" alignItems="left" gap={5}>
              {recordingsToCapture > 1 && (
                <Text>{`${
                  continuousRecording ? "Seconds" : "Recordings"
                } remaining: ${recordingsRemaingTextValue}`}</Text>
              )}
              <VStack height="100px" justifyContent="center">
                {recordingStatus === RecordingStatus.Recording && (
                  <Text
                    fontSize="5xl"
                    textAlign="center"
                    fontWeight="bold"
                    color="brand.500"
                  >
                    <FormattedMessage id="recording" />
                  </Text>
                )}
                {recordingStatus === RecordingStatus.Countdown && (
                  <Text
                    fontSize={countdownStages[countdownStageIndex].fontSize}
                    textAlign="center"
                    fontWeight="bold"
                    color="brand.500"
                  >
                    {countdownStages[countdownStageIndex].value}
                  </Text>
                )}
                {recordingStatus === RecordingStatus.Done && (
                  <Text
                    fontSize="5xl"
                    textAlign="center"
                    fontWeight="bold"
                    color="brand.500"
                  >
                    <FormattedMessage id="recording-complete" />
                  </Text>
                )}
              </VStack>
              <Progress
                alignSelf="center"
                w="280px"
                h="24px"
                colorScheme="red"
                borderRadius="xl"
                value={progress}
              />
              <Button
                variant="warning"
                width="fit-content"
                alignSelf="center"
                onClick={handleOnClose}
                disabled={recordingStatus === RecordingStatus.Done}
                opacity={recordingStatus === RecordingStatus.Done ? 0.5 : 1}
              >
                <FormattedMessage id="cancel-recording-action" />
              </Button>
            </VStack>
          </ModalBody>
          <ModalFooter />
        </ModalContent>
      </ModalOverlay>
    </Modal>
  );
};

interface RecordingOptions {
  onDone: (data: XYZData) => void;
  onError: () => void;
  onProgress: (percentage: number) => void;
}

interface InProgressRecording extends RecordingOptions {
  startTimeMillis: number;
}

interface RecordingDataSource {
  startRecording(options: RecordingOptions): void;
  cancelRecording(): void;
}

const useRecordingDataSource = (): RecordingDataSource => {
  const ref = useRef<InProgressRecording | undefined>();
  const dataWindow = useStore((s) => s.dataWindow);
  const bufferedData = useBufferedData();
  useEffect(() => {
    const listener = (sample: TimedXYZ) => {
      if (ref.current) {
        const percentage =
          ((sample.timestamp - ref.current.startTimeMillis) /
            dataWindow.duration) *
          100;
        ref.current.onProgress(percentage);
      }
    };
    bufferedData.addListener(listener);
    return () => {
      bufferedData.removeListener(listener);
    };
  }, [bufferedData, dataWindow.duration]);

  return useMemo(
    () => ({
      timeout: undefined as ReturnType<typeof setTimeout> | undefined,

      startRecording(options: RecordingOptions) {
        this.timeout = setTimeout(() => {
          if (ref.current) {
            const data = bufferedData.getSamples(
              ref.current.startTimeMillis,
              ref.current.startTimeMillis + dataWindow.duration
            );
            const sampleCount = data.x.length;
            if (sampleCount < dataWindow.minSamples) {
              ref.current.onError();
              ref.current = undefined;
            } else {
              ref.current.onProgress(100);
              ref.current.onDone(data);
              ref.current = undefined;
            }
          }
        }, dataWindow.duration);

        ref.current = {
          startTimeMillis: Date.now(),
          ...options,
        };
      },
      cancelRecording() {
        clearTimeout(this.timeout);
        ref.current = undefined;
      },
    }),
    [bufferedData, dataWindow.duration, dataWindow.minSamples]
  );
};

export default RecordingDialog;
