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
import { HStack, VStack } from "@chakra-ui/react";
import { FormattedMessage, useIntl } from "react-intl";
import { useSettings } from "../store";
import { useCallback, useMemo } from "react";
import { defaultSettings, graphColorSchemeOptions } from "../settings";
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
    setSettings(defaultSettings);
  }, [setSettings]);

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
            </VStack>
          </ModalBody>
          <ModalFooter>
            <HStack gap={5}>
              <Button variant="secondary" onClick={handleResetToDefault}>
                Reset to default
              </Button>
              <Button variant="primary" onClick={onClose}>
                <FormattedMessage id="close-action" />
              </Button>
            </HStack>
          </ModalFooter>
        </ModalContent>
      </ModalOverlay>
    </Modal>
  );
};
