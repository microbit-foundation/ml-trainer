/**
 * (c) 2024, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import {
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  ProgressBar,
  VStack,
} from "../shared-ui";
import { FormattedMessage, useIntl } from "react-intl";

export interface DownloadingDialogProps {
  isOpen: boolean;
  progress: number;
  finalFocusRef?: React.RefObject<HTMLButtonElement>;
}

const TrainingModelProgressDialog = ({
  isOpen,
  progress,
  finalFocusRef,
}: DownloadingDialogProps) => {
  const intl = useIntl();
  return (
    <Modal
      isDismissable={false}
      motionless
      isOpen={isOpen}
      onClose={() => {}}
      size={{ base: "full", md: "2xl" }}
      isCentered
      finalFocusRef={finalFocusRef}
    >
      <ModalHeader>
        <FormattedMessage id="training-model" />
      </ModalHeader>
      <ModalBody>
        <VStack width="100%" alignItems="stretch">
          <ProgressBar
            value={progress}
            aria-label={intl.formatMessage({ id: "training-model" })}
            css={{ borderRadius: "100px" }}
            barCss={{ bg: "brand2.500" }}
          />
        </VStack>
      </ModalBody>
      <ModalFooter />
    </Modal>
  );
};

export default TrainingModelProgressDialog;
