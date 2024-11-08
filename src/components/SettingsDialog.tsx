/**
 * (c) 2021, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { Button } from "@chakra-ui/button";
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
} from "@chakra-ui/modal";
import { FormControl, FormHelperText, VStack } from "@chakra-ui/react";
import { useCallback, useMemo } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { defaultSettings, graphColorSchemeOptions } from "../settings";
import { useSettings } from "../store";
import SelectFormControl, { createOptions } from "./SelectFormControl";

interface SettingsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  finalFocusRef?: React.RefObject<HTMLButtonElement>;
}

export const SettingsDialog = ({
  isOpen,
  onClose,
  finalFocusRef,
}: SettingsDialogProps) => {
  const [settings, setSettings] = useSettings();
  const intl = useIntl();

  const handleResetToDefault = useCallback(() => {
    setSettings({ ...defaultSettings, languageId: settings.languageId });
  }, [setSettings, settings.languageId]);

  const options = useMemo(() => {
    return {
      graphColorScheme: createOptions(
        graphColorSchemeOptions,
        "graph-color-scheme",
        intl
      ),
    };
  }, [intl]);
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="xl"
      finalFocusRef={finalFocusRef}
    >
      <ModalOverlay>
        <ModalContent>
          <ModalHeader fontSize="lg" fontWeight="bold">
            <FormattedMessage id="settings" />
          </ModalHeader>
          <ModalBody>
            <VStack alignItems="flex-start" spacing={5}>
              <SelectFormControl
                id="graphLineColors"
                label={intl.formatMessage({ id: "graph-color-scheme" })}
                options={options.graphColorScheme}
                value={settings.graphColorScheme}
                onChange={(graphColorScheme) =>
                  setSettings({
                    ...settings,
                    graphColorScheme,
                  })
                }
              />
              <FormControl>
                <Button variant="link" onClick={handleResetToDefault}>
                  <FormattedMessage id="restore-defaults-action" />
                </Button>
                <FormHelperText>
                  <FormattedMessage id="restore-defaults-helper" />
                </FormHelperText>
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="primary" onClick={onClose}>
              <FormattedMessage id="close-action" />
            </Button>
          </ModalFooter>
        </ModalContent>
      </ModalOverlay>
    </Modal>
  );
};
