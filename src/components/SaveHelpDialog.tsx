/**
 * (c) 2024, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import {
  Button,
  Checkbox,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalFooter,
  ModalHeader,
  Stack,
  Text,
  VStack,
} from "../shared-ui";
import { useCallback } from "react";
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
    (checked: boolean) => {
      setSettings({ showPreSaveHelp: !checked });
    },
    [setSettings]
  );

  const shareOrSave =
    useStore((s) => s.save.type) === SaveType.Share ? "share" : "save";

  return (
    <Modal size="xl" isOpen={isOpen} onClose={onClose} isCentered>
      <ModalHeader level={2} css={{ fontWeight: "bold" }}>
        <FormattedMessage id={`${shareOrSave}-hex-dialog-heading`} />
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
              <FormattedMessage id="save-hex-dialog-message2" />
            </Text>
          </VStack>
        </Stack>
      </ModalBody>
      <ModalFooter>
        <ModalFooterContent
          leftContent={
            <Checkbox isSelected={skip} onChange={handleChangeSkip}>
              <FormattedMessage id="dont-show-again" />
            </Checkbox>
          }
        >
          <Button size="lg" variant="primary" onPress={onSave}>
            <FormattedMessage id={`${shareOrSave}-action`} />
          </Button>
        </ModalFooterContent>
      </ModalFooter>
    </Modal>
  );
};

export default SaveHelpDialog;
