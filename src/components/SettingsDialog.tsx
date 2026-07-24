/**
 * (c) 2021-2024, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { useCallback, useMemo, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import {
  Box,
  Button,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  Switch,
  Text,
  VStack,
} from "@microbit/ui";
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

const helperTextCss = { mt: 2, fontSize: "sm", color: "gray.600" } as const;

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
  // Unlike Chakra, react-aria focuses the dialog itself on open (not the
  // first form control), so no initial-focus hack is needed to stop the
  // first <select> opening its picker on mobile.
  const [isResetConfirmOpen, setResetConfirmOpen] = useState(false);
  const handleResetToDefault = useCallback(() => {
    setResetConfirmOpen(true);
  }, []);

  const confirmResetToDefault = useCallback(() => {
    setSettings({
      ...defaultSettings,
      languageId: settings.languageId,
      toursCompleted: settings.toursCompleted,
      // Privacy decisions aren't a UI preference — preserve through
      // "Restore defaults" so users aren't re-prompted unexpectedly.
      analyticsConsent: settings.analyticsConsent,
    });
    setResetConfirmOpen(false);
  }, [
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
        isOpen={isResetConfirmOpen}
        onConfirm={confirmResetToDefault}
        confirmText={intl.formatMessage({
          id: "restore-defaults-confirm-action",
        })}
        onCancel={() => setResetConfirmOpen(false)}
      />
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        size={{ base: "full", md: "xl" }}
        finalFocusRef={finalFocusRef}
      >
        <ModalHeader css={{ fontSize: "lg", fontWeight: "bold" }}>
          <FormattedMessage id="settings" />
        </ModalHeader>
        <ModalBody>
          <VStack alignItems="flex-start" gap={5}>
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
              {/* Native aspect-ratio rather than the AspectRatio pattern: the
                  pattern's `&>*` child selector loses to the (still-Chakra)
                  RecordingGraph's own position style, leaving its padding
                  spacer above an in-flow child. */}
              <Box w="full" css={{ aspectRatio: "526 / 92" }}>
                <RecordingGraph
                  responsive
                  data={previewGraphData}
                  role="img"
                  w="full"
                  aria-label={intl.formatMessage({
                    id: "recording-graph-label",
                  })}
                />
              </Box>
            </VStack>
            {showAnalyticsToggle && (
              <Box w="full">
                <Switch
                  isSelected={settings.analyticsConsent === "granted"}
                  onChange={(granted) => {
                    setSettings({
                      analyticsConsent: granted ? "granted" : "denied",
                    });
                    logging.setConsent(granted);
                  }}
                  // Label left, switch right (Chakra FormLabel + Switch row);
                  // zero the label-after-track indent the recipe adds.
                  css={{
                    width: "100%",
                    flexDirection: "row-reverse",
                    justifyContent: "space-between",
                    "& .switch__label": { marginStart: 0 },
                  }}
                >
                  <FormattedMessage id="analytics-consent-setting-label" />
                </Switch>
                <Text css={{ ...helperTextCss, lineHeight: "base" }}>
                  <FormattedMessage id="analytics-consent-setting-helper" />
                </Text>
              </Box>
            )}
            <Box w="full">
              <Button variant="link" onPress={handleResetToDefault}>
                <FormattedMessage id="restore-defaults-action" />
              </Button>
              <Text css={helperTextCss}>
                <FormattedMessage id="restore-defaults-helper" />
              </Text>
            </Box>
          </VStack>
        </ModalBody>
        <ModalFooter>
          <Button variant="primary" onPress={onClose}>
            <FormattedMessage id="close-action" />
          </Button>
        </ModalFooter>
      </Modal>
    </>
  );
};
