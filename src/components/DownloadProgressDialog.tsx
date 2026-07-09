/**
 * (c) 2024, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import {
  Box,
  Button,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  ProgressBar,
  Text,
  VStack,
} from "../shared-ui";
import { ProgressStage } from "@microbit/microbit-connection";
import { FormattedMessage, useIntl } from "react-intl";
import { DataConnectionType, RadioFlowPhase } from "../data-connection-flow";
import { isNativePlatform } from "../platform";
import ChooseDeviceOverlay from "./ChooseDeviceOverlay";
import LoadingAnimation from "./LoadingAnimation";
import BluetoothPatternInput from "./BluetoothPatternInput";
import { getLegacyTextIdIfNeeded } from "../get-legacy-text-id";

export interface DownloadProgressDialogProps {
  isOpen: boolean;
  headingId: string;
  stage: ProgressStage | undefined;
  progress: number | undefined;
  tryAgain?: () => void;
  microbitName: string | undefined;
}

export const getHeadingId = (
  flowType: DataConnectionType,
  radioFlowPhase?: RadioFlowPhase
): string => {
  switch (flowType) {
    case DataConnectionType.WebBluetooth:
      return "downloading-data-collection-header";
    case DataConnectionType.NativeBluetooth:
      return "downloading-data-collection-microbit-header";
    case DataConnectionType.Radio:
      return radioFlowPhase === "bridge"
        ? "downloading-radio-link-header"
        : "downloading-data-collection-header";
  }
};

const getSubtitleId = (
  stage: ProgressStage | undefined
): string | undefined => {
  switch (stage) {
    case ProgressStage.Initializing:
      return undefined;
    case ProgressStage.FindingDevice:
      return "downloading-stage-finding-device";
    case ProgressStage.CheckingBond:
      return "downloading-stage-checking-bond";
    case ProgressStage.ResettingDevice:
      return "downloading-stage-resetting-device";
    case ProgressStage.Connecting:
      return getLegacyTextIdIfNeeded({
        legacyId: "connecting",
        id: "downloading-stage-connecting",
      });
    case ProgressStage.PartialFlashing:
    case ProgressStage.FullFlashing:
      return isNativePlatform()
        ? "downloading-stage-flashing-native"
        : "downloading-subtitle";
    default:
      throw new Error(stage);
  }
};

const noop = () => {};

const DownloadProgressDialog = ({
  isOpen,
  headingId,
  stage,
  progress,
  tryAgain,
  microbitName,
}: DownloadProgressDialogProps) => {
  const intl = useIntl();
  // Skip showing dialog when stage is undefined (not yet started).
  if (stage === undefined) {
    return null;
  }
  // On web, show overlay instead of dialog while browser device picker is open.
  // On native, show progress dialog during device scanning.
  if (!isNativePlatform() && stage === ProgressStage.FindingDevice) {
    return <ChooseDeviceOverlay />;
  }
  const isIndeterminate = progress === undefined;
  const subtitleId = getSubtitleId(stage);
  const isFindingDevice = stage === ProgressStage.FindingDevice;
  return (
    <Modal
      isDismissable={false}
      motionless
      isOpen={isOpen}
      onClose={noop}
      size={{ base: "full", md: "3xl" }}
      isCentered
    >
      <ModalHeader>
        <FormattedMessage id={headingId} />
      </ModalHeader>
      <ModalBody>
        <VStack
          width="100%"
          gap={5}
          alignItems={isIndeterminate ? "center" : "flex-start"}
        >
          <Text textAlign={isIndeterminate ? "center" : "left"}>
            {subtitleId ? <FormattedMessage id={subtitleId} /> : "\u00A0"}
          </Text>
          {isNativePlatform() && isFindingDevice ? (
            <BluetoothPatternInput
              microbitName={microbitName}
              invalid={false}
            />
          ) : isIndeterminate ? (
            <LoadingAnimation />
          ) : (
            <Box h={25} display="flex" alignItems="center" width="100%">
              <ProgressBar
                value={progress * 100}
                aria-label={intl.formatMessage({ id: headingId })}
                css={{ borderRadius: "100px" }}
                barCss={{ bg: "brand2.500" }}
              />
            </Box>
          )}
        </VStack>
      </ModalBody>
      <ModalFooter css={{ justifyContent: "start" }}>
        {isNativePlatform() && tryAgain && isFindingDevice && (
          <Button
            variant="link"
            css={{ color: "brand.600" }}
            onPress={tryAgain}
          >
            <FormattedMessage id="connect-native-change-pattern" />
          </Button>
        )}
      </ModalFooter>
    </Modal>
  );
};

export default DownloadProgressDialog;
