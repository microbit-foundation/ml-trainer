import {
  Button,
  Heading,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
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
import { GestureData, useGestureActions, XYZData } from "../gestures-hooks";
import { mlSettings } from "../ml";
import { MlStage, useMlStatus } from "../ml-status-hooks";

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
  const toast = useToast();
  const actions = useGestureActions();
  const recordingDataSource = useRecordingDataSource();
  const [, setStatus] = useMlStatus();
  const [recordingStatus, setRecordingStatus] = useState<RecordingStatus>(
    RecordingStatus.None
  );
  const countdownStages: CountdownStage[] = useMemo(
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
  const [countdownStageIndex, setCountdownStageIndex] = useState<number>(0);

  const handleCleanup = useCallback(() => {
    setRecordingStatus(RecordingStatus.None);
    setStatus({ stage: MlStage.NotTrained });
    setCountdownStageIndex(0);
    setProgress(0);
    onClose();
  }, [onClose, setStatus]);

  const handleOnClose = useCallback(() => {
    recordingDataSource.cancelRecording();
    handleCleanup();
  }, [handleCleanup, recordingDataSource]);

  useEffect(() => {
    if (isOpen) {
      // When dialog is opened, restart countdown
      setRecordingStatus(RecordingStatus.Countdown);
      setCountdownStageIndex(0);
    }
  }, [isOpen]);

  const [progress, setProgress] = useState(0);
  useEffect(() => {
    if (recordingStatus === RecordingStatus.Countdown) {
      const config = countdownStages[countdownStageIndex];

      const countdownTimeout = setTimeout(() => {
        if (countdownStageIndex < countdownStages.length - 1) {
          setCountdownStageIndex(countdownStageIndex + 1);
          return;
        } else {
          setRecordingStatus(RecordingStatus.Recording);
          setStatus({ stage: MlStage.RecordingData });
          recordingDataSource.startRecording({
            onDone(data) {
              actions.addGestureRecordings(gestureId, [
                { ID: Date.now(), data },
              ]);
              handleCleanup();
            },
            onError() {
              handleCleanup();

              toast({
                position: "top",
                duration: 5_000,
                title: intl.formatMessage({
                  id: "alert.recording.disconnectedDuringRecording",
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
      };
    }
  }, [
    countdownStages,
    isOpen,
    recordingStatus,
    countdownStageIndex,
    setStatus,
    recordingDataSource,
    actions,
    gestureId,
    handleOnClose,
    handleCleanup,
    toast,
    intl,
  ]);

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
                    fontSize={countdownStages[countdownStageIndex].fontSize}
                    textAlign="center"
                    fontWeight="bold"
                    color="brand.500"
                  >
                    {countdownStages[countdownStageIndex].value}
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
  const bufferedData = useBufferedData();
  useEffect(() => {
    const listener = (sample: TimedXYZ) => {
      if (ref.current) {
        const percentage =
          ((sample.timestamp - ref.current.startTimeMillis) /
            mlSettings.duration) *
          100;
        ref.current.onProgress(percentage);
      }
    };
    bufferedData.addListener(listener);
    return () => {
      bufferedData.removeListener(listener);
    };
  }, [bufferedData]);

  return useMemo(
    () => ({
      timeout: undefined as ReturnType<typeof setTimeout> | undefined,

      startRecording(options: RecordingOptions) {
        this.timeout = setTimeout(() => {
          if (ref.current) {
            const data = bufferedData.getSamples(
              ref.current.startTimeMillis,
              ref.current.startTimeMillis + mlSettings.duration
            );
            const sampleCount = data.x.length;
            if (sampleCount < mlSettings.minSamples) {
              ref.current.onError();
              ref.current = undefined;
            } else {
              ref.current.onProgress(100);
              ref.current.onDone(data);
              ref.current = undefined;
            }
          }
        }, mlSettings.duration);

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
    [bufferedData]
  );
};

export default RecordingDialog;
