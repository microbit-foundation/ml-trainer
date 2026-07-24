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
  Text,
  VStack,
} from "@microbit/ui";
import { FormattedMessage } from "react-intl";
import { useStore } from "../store";
import { SaveType } from "../model";
import LoadingAnimation from "./LoadingAnimation";

export interface SavingDialogProps {
  isOpen: boolean;
}

const SaveProgressDialog = ({ isOpen }: SavingDialogProps) => {
  const isShare = useStore((s) => s.save.type) === SaveType.Share;
  const sharingOrSaving = isShare ? "sharing" : "saving";

  return (
    <Modal
      isDismissable={false}
      motionless
      isOpen={isOpen}
      onClose={() => {}}
      size={{ base: "full", md: "3xl" }}
      isCentered
    >
      <ModalHeader>
        <FormattedMessage id={`${sharingOrSaving}-title`} />
      </ModalHeader>
      <ModalBody>
        <VStack width="100%" alignItems="center" gap={5}>
          <Text textAlign="center">
            <FormattedMessage id={`${sharingOrSaving}-description`} />
          </Text>
          <LoadingAnimation />
        </VStack>
      </ModalBody>
      <ModalFooter />
    </Modal>
  );
};

export default SaveProgressDialog;
