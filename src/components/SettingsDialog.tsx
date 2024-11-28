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
import {
  AspectRatio,
  FormControl,
  FormHelperText,
  Text,
  useDisclosure,
  VStack,
} from "@chakra-ui/react";
import { useCallback, useMemo } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import {
  defaultSettings,
  graphColorSchemeOptions,
  graphLineSchemeOptions,
  graphLineWeightOptions,
} from "../settings";
import { useSettings } from "../store";
import { previewGraphData } from "../utils/preview-graph-data";
import { ConfirmDialog } from "./ConfirmDialog";
import RecordingGraph from "./RecordingGraph";
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
  const resetConfirmDialog = useDisclosure();
  const handleResetToDefault = useCallback(() => {
    resetConfirmDialog.onOpen();
  }, [resetConfirmDialog]);

  const confirmResetToDefault = useCallback(() => {
    setSettings({
      ...defaultSettings,
      languageId: settings.languageId,
      toursCompleted: settings.toursCompleted,
    });
    resetConfirmDialog.onClose();
  }, [
    resetConfirmDialog,
    setSettings,
    settings.languageId,
    settings.toursCompleted,
  ]);

  const options = useMemo(() => {
    return {
      graphColorScheme: createOptions(
        graphColorSchemeOptions,
        "graph-color-scheme",
        intl
      ),
      graphLineScheme: createOptions(
        graphLineSchemeOptions,
        "graph-line-scheme",
        intl
      ),
      graphLineWeight: createOptions(
        graphLineWeightOptions,
        "graph-line-weight",
        intl
      ),
    };
  }, [intl]);
  return (
    <>
      <ConfirmDialog
        heading={intl.formatMessage({
          id: "restore-defaults-confirm-heading",
        })}
        body={intl.formatMessage({
          id: "restore-defaults-confirm-body",
        })}
        isOpen={resetConfirmDialog.isOpen}
        onConfirm={confirmResetToDefault}
        confirmText={intl.formatMessage({
          id: "restore-defaults-confirm-action",
        })}
        onCancel={resetConfirmDialog.onClose}
      />
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
                <SelectFormControl
                  id="graphLineScheme"
                  label={intl.formatMessage({ id: "graph-line-scheme" })}
                  options={options.graphLineScheme}
                  value={settings.graphLineScheme}
                  onChange={(graphLineScheme) =>
                    setSettings({
                      ...settings,
                      graphLineScheme,
                    })
                  }
                />
                <SelectFormControl
                  id="graphLineWeight"
                  label={intl.formatMessage({ id: "graph-line-weight" })}
                  options={options.graphLineWeight}
                  value={settings.graphLineWeight}
                  onChange={(graphLineWeight) =>
                    setSettings({
                      ...settings,
                      graphLineWeight,
                    })
                  }
                />
                <VStack alignItems="flex-start" w="full">
                  <Text>Graph preview</Text>
                  <AspectRatio ratio={526 / 92} w="full">
                    <RecordingGraph
                      responsive
                      data={previewGraphData}
                      role="img"
                      w="full"
                      aria-label={intl.formatMessage({
                        id: "recording-graph-label",
                      })}
                    />
                  </AspectRatio>
                </VStack>
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
    </>
  );
};
