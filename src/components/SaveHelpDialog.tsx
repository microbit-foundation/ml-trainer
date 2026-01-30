/**
 * (c) 2024, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import {
  Button,
  Checkbox,
  Heading,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Stack,
  Text,
  VStack,
} from "@chakra-ui/react";
import { FormattedMessage } from "react-intl";
import { useSettings } from "../store";
import { ChangeEvent, useCallback } from "react";
import { useDeployment } from "../deployment";
import { Capacitor } from "@capacitor/core";

interface SaveHelpDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
}

const SaveHelpDialog = ({ isOpen, onClose, onSave }: SaveHelpDialogProps) => {
  const { appNameFull } = useDeployment();
  const [settings, setSettings] = useSettings();
  const skip = !settings.showPreSaveHelp;
  const handleChangeSkip = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      setSettings({ showPreSaveHelp: !e.currentTarget.checked });
    },
    [setSettings]
  );

  const isShare = Capacitor.isNativePlatform();

  const dialogHeadingId = isShare
    ? "share-hex-dialog-heading"
    : "save-hex-dialog-heading";
  const message1Id = isShare
    ? "share-hex-dialog-message1"
    : "save-hex-dialog-message1";
  const message2Id = isShare
    ? "share-hex-dialog-message2"
    : "save-hex-dialog-message2";
  return (
    <Modal size="xl" isOpen={isOpen} onClose={onClose} isCentered>
      <ModalOverlay>
        <ModalContent>
          <ModalHeader>
            <Heading as="h2" fontSize="xl" fontWeight="bold">
              <FormattedMessage id={dialogHeadingId} />
            </Heading>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Stack gap={5}>
              <VStack gap={3}>
                <Text>
                  <FormattedMessage id={message1Id} values={{ appNameFull }} />
                </Text>
                <Text>
                  <FormattedMessage id={message2Id} />
                </Text>
              </VStack>
            </Stack>
          </ModalBody>
          <ModalFooter justifyContent="space-between">
            <Checkbox isChecked={skip} onChange={handleChangeSkip}>
              <FormattedMessage id="dont-show-again" />
            </Checkbox>
            <Button size="lg" variant="primary" onClick={onSave}>
              <FormattedMessage id="share-action" />
            </Button>
          </ModalFooter>
        </ModalContent>
      </ModalOverlay>
    </Modal>
  );
};

export default SaveHelpDialog;
