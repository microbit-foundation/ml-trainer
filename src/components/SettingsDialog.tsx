/**
 * (c) 2021-2024, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import {
  AspectRatio,
  Button,
  FormControl,
  FormHelperText,
  FormLabel,
  HStack,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Switch,
  Text,
  useDisclosure,
  VStack,
} from "@chakra-ui/react";
import { useCallback, useMemo, useRef } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { useDeployment } from "../deployment";
import { isNativePlatform } from "../platform";
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
  const { logging } = useDeployment();
  const intl = useIntl();
  // Show the analytics toggle only when the native consent flow is the
  // active surface; the web build defers to the shared-assets cookie
  // modal accessed via the nav-drawer "Manage cookies" link.
  const showAnalyticsToggle = isNativePlatform();
  // Focus the heading rather than the first form control on open. Otherwise
  // the graph colour scheme <select> takes focus and on mobile that opens its
  // picker as soon as the dialog appears.
  const initialFocusRef = useRef<HTMLHeadingElement>(null);
  const resetConfirmDialog = useDisclosure();
  const handleResetToDefault = useCallback(() => {
    resetConfirmDialog.onOpen();
  }, [resetConfirmDialog]);

  const confirmResetToDefault = useCallback(() => {
    setSettings({
      ...defaultSettings,
      languageId: settings.languageId,
      toursCompleted: settings.toursCompleted,
      // Privacy decisions aren't a UI preference — preserve through
      // "Restore defaults" so users aren't re-prompted unexpectedly.
      analyticsConsent: settings.analyticsConsent,
    });
    resetConfirmDialog.onClose();
  }, [
    resetConfirmDialog,
    setSettings,
    settings.analyticsConsent,
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
        size={{ base: "full", md: "xl" }}
        finalFocusRef={finalFocusRef}
        initialFocusRef={initialFocusRef}
      >
        <ModalOverlay>
          <ModalContent>
            <ModalHeader
              ref={initialFocusRef}
              tabIndex={-1}
              _focus={{ outline: "none", boxShadow: "none" }}
              fontSize="lg"
              fontWeight="bold"
            >
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
                  <Text>
                    <FormattedMessage id="graph-preview" />
                  </Text>
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
                {showAnalyticsToggle && (
                  <FormControl>
                    <HStack justify="space-between" align="center">
                      <FormLabel
                        htmlFor="analyticsConsent"
                        mb={0}
                        fontWeight="normal"
                      >
                        <FormattedMessage id="analytics-consent-setting-label" />
                      </FormLabel>
                      <Switch
                        id="analyticsConsent"
                        isChecked={settings.analyticsConsent === "granted"}
                        onChange={(e) => {
                          const granted = e.target.checked;
                          setSettings({
                            analyticsConsent: granted ? "granted" : "denied",
                          });
                          logging.setConsent(granted);
                        }}
                      />
                    </HStack>
                    <FormHelperText lineHeight="base">
                      <FormattedMessage id="analytics-consent-setting-helper" />
                    </FormHelperText>
                  </FormControl>
                )}
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
