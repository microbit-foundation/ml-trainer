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
import { ActionData, XYZData } from "../model";
import { useStore } from "../store";

interface CountdownStage {
  value: string | number;
  duration: number;
  fontSize?: string;
}

export interface RecordingOptions {
  recordingsToCapture: number;
  continuousRecording: boolean;
}

export interface RecordingDialogProps {
  isOpen: boolean;
  onClose: () => void;
  actionName: string;
  actionId: ActionData["ID"];
  onRecordingComplete: (recordingId: number) => void;
  recordingOptions: RecordingOptions;
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
  actionId,
  onRecordingComplete,
  recordingOptions,
}: RecordingDialogProps) => {
  const intl = useIntl();
  const toast = useToast();
  const recordingStarted = useStore((s) => s.recordingStarted);
  const recordingStopped = useStore((s) => s.recordingStopped);
  const addActionRecordings = useStore((s) => s.addActionRecordings);
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
  const { continuousRecording, recordingsToCapture } = recordingOptions;
  const [recordingsRemaining, setRecordingsRemaining] = useState<
    number | undefined
  >(recordingsToCapture);

  const handleCleanup = useCallback(() => {
    recordingStopped();
    setRecordingStatus(RecordingStatus.None);
    setCountdownStageIndex(0);
    setProgress(0);
    setRunningContinuously(false);
    onClose();
    setRecordingsRemaining(undefined);
  }, [onClose, recordingStopped]);

  const handleOnClose = useCallback(() => {
    recordingDataSource.cancelRecording();
    handleCleanup();
  }, [handleCleanup, recordingDataSource]);

  const decrementRecordingsRemaining = useCallback(() => {
    setRecordingsRemaining((prev) =>
      prev === undefined ? undefined : prev === 0 ? 0 : prev - 1
    );
  }, []);

  const startRecording = useCallback(() => {
    decrementRecordingsRemaining();
    recordingStopped();
    setRecordingStatus(RecordingStatus.Countdown);
    setCountdownStageIndex(0);
    setProgress(0);
  }, [decrementRecordingsRemaining, recordingStopped]);

  const [runningContinuously, setRunningContinuously] =
    useState<boolean>(false);

  const continueRecording = useCallback(() => {
    decrementRecordingsRemaining();
    recordingStopped();
    setRunningContinuously(true);
    setProgress(0);
  }, [decrementRecordingsRemaining, recordingStopped]);

  useEffect(() => {
    if (isOpen) {
      setRecordingsRemaining(recordingsToCapture);
      // When dialog is opened, restart countdown
      startRecording();
    }
  }, [isOpen, recordingsToCapture, startRecording]);

  const startRecordingInternal = useCallback(() => {
    recordingDataSource.startRecording({
      onDone(data) {
        const recordingId = Date.now();
        addActionRecordings(actionId, [{ ID: recordingId, data }]);
        if (continuousRecording && recordingsRemaining) {
          continueRecording();
        } else if (!continuousRecording && recordingsRemaining) {
          startRecording();
        } else {
          setRunningContinuously(false);
          decrementRecordingsRemaining();
          setRecordingStatus(RecordingStatus.Done);
          // Trigger recordingStopped before timeout for live graph overlay.
          // We also do this in handleCleanup and is required there for
          // the error and close dialog cases.
          recordingStopped();
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
  }, [
    addActionRecordings,
    continueRecording,
    continuousRecording,
    decrementRecordingsRemaining,
    actionId,
    handleCleanup,
    intl,
    onRecordingComplete,
    recordingDataSource,
    recordingStopped,
    recordingsRemaining,
    startRecording,
    toast,
  ]);

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
          startRecordingInternal();
        }
      }, config.duration);
      return () => {
        clearTimeout(countdownTimeout);
        doneTimeout.current && clearTimeout(doneTimeout.current);
      };
    } else if (runningContinuously) {
      recordingStarted();
      startRecordingInternal();
    }
  }, [
    countdownStageIndex,
    countdownStages,
    recordingStarted,
    recordingStatus,
    recordingsRemaining,
    runningContinuously,
    startRecordingInternal,
  ]);

  const currentSampleNumber = useMemo(() => {
    // Show the correct current sample number without having
    // the initial figures change just after the dialog opens.
    if (recordingsRemaining === undefined) {
      return 1;
    }
    return recordingsToCapture - recordingsRemaining;
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
          <ModalHeader pb={0}>
            {recordingsToCapture > 1 ? (
              <FormattedMessage
                id="recording-data-for-numbered"
                values={{
                  action: actionName,
                  sample: currentSampleNumber,
                  numSamples: recordingsToCapture,
                }}
              />
            ) : (
              <FormattedMessage
                id="recording-data-for"
                values={{ action: actionName }}
              />
            )}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody py={8}>
            <VStack justifyContent="center" gap={5}>
              <VStack h="20" alignItems="center" justifyContent="center">
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
            </VStack>
          </ModalBody>
          <ModalFooter justifyContent="center" pb={7} pt={2}>
            <Button
              variant="warning"
              width="fit-content"
              onClick={handleOnClose}
              disabled={recordingStatus === RecordingStatus.Done}
              opacity={recordingStatus === RecordingStatus.Done ? 0.5 : 1}
            >
              <FormattedMessage
                id={
                  recordingsToCapture > 1
                    ? "stop-recording-action"
                    : "cancel-recording-action"
                }
              />
            </Button>
          </ModalFooter>
        </ModalContent>
      </ModalOverlay>
    </Modal>
  );
};

interface RecordingConfig {
  onDone: (data: XYZData) => void;
  onError: () => void;
  onProgress: (percentage: number) => void;
}

interface InProgressRecording extends RecordingConfig {
  startTimeMillis: number;
}

interface RecordingDataSource {
  startRecording(config: RecordingConfig): void;
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

      startRecording(options: RecordingConfig) {
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
