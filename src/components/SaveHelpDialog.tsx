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
import { ChangeEvent, useCallback } from "react";
import { FormattedMessage } from "react-intl";
import { useDeployment } from "../deployment";
import { useSettings, useStore } from "../store";
import ModalFooterContent from "./ModalFooterContent";
import { SaveType } from "../model";

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

  const shareOrSave =
    useStore((s) => s.save.type) === SaveType.Share ? "share" : "save";

  return (
    <Modal size="xl" isOpen={isOpen} onClose={onClose} isCentered>
      <ModalOverlay>
        <ModalContent>
          <ModalHeader>
            <Heading as="h2" fontSize="xl" fontWeight="bold">
              <FormattedMessage id={`${shareOrSave}-hex-dialog-heading`} />
            </Heading>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Stack gap={5}>
              <VStack gap={3}>
                <Text>
                  <FormattedMessage
                    id={`${shareOrSave}-hex-dialog-message1`}
                    values={{ appNameFull }}
                  />
                </Text>
                <Text>
                  <FormattedMessage id={`${shareOrSave}-hex-dialog-message2`} />
                </Text>
              </VStack>
            </Stack>
          </ModalBody>
          <ModalFooter>
            <ModalFooterContent
              leftContent={
                <Checkbox isChecked={skip} onChange={handleChangeSkip}>
                  <FormattedMessage id="dont-show-again" />
                </Checkbox>
              }
            >
              <Button size="lg" variant="primary" onClick={onSave}>
                <FormattedMessage id={`${shareOrSave}-action`} />
              </Button>
            </ModalFooterContent>
          </ModalFooter>
        </ModalContent>
      </ModalOverlay>
    </Modal>
  );
};

export default SaveHelpDialog;
