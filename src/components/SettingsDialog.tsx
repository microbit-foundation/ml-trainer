/**
 * (c) 2021-2024, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { ReactNode, useCallback, useMemo, useState } from "react";
import { FormattedMessage, IntlShape, useIntl } from "react-intl";
import {
  Box,
  Button,
  FieldHelperText,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  NativeSelectField,
  Switch,
  Text,
  VStack,
} from "@microbit/ui";
import { useDeployment } from "../deployment";
import { isNativePlatform } from "../platform";
import {
  defaultSettings,
  GraphColorScheme,
  graphColorSchemeOptions,
  GraphLineScheme,
  graphLineSchemeOptions,
  GraphLineWeight,
  graphLineWeightOptions,
} from "../settings";
import { useSettings } from "../store";
import { previewGraphData } from "../utils/preview-graph-data";
import { ConfirmDialog } from "./ConfirmDialog";
import RecordingGraph from "./RecordingGraph";

interface SettingsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  finalFocusRef?: React.RefObject<HTMLButtonElement>;
}

/**
 * Translated <option>s for a settings select.
 *
 * @param values Values to create options for.
 * @param prefix Prefix (no trailing '-') to use for translation keys.
 * @param intl For translation strings.
 */
const createOptions = (
  values: readonly string[],
  prefix: string,
  intl: IntlShape
): ReactNode =>
  values.map((value) => (
    <option key={value} value={value}>
      {intl.formatMessage({ id: `${prefix}-${value}` })}
    </option>
  ));

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
  // react-aria focuses the dialog itself on open (not the first form
  // control), which stops the first <select> opening its picker on mobile.
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
            <NativeSelectField
              id="graphLineColors"
              label={intl.formatMessage({ id: "graph-color-scheme" })}
              labelPosition="side"
              wrapperCss={{ width: "28ch" }}
              value={settings.graphColorScheme}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  graphColorScheme: e.currentTarget.value as GraphColorScheme,
                })
              }
            >
              {options.graphColorScheme}
            </NativeSelectField>
            <NativeSelectField
              id="graphLineScheme"
              label={intl.formatMessage({ id: "graph-line-scheme" })}
              labelPosition="side"
              wrapperCss={{ width: "28ch" }}
              value={settings.graphLineScheme}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  graphLineScheme: e.currentTarget.value as GraphLineScheme,
                })
              }
            >
              {options.graphLineScheme}
            </NativeSelectField>
            <NativeSelectField
              id="graphLineWeight"
              label={intl.formatMessage({ id: "graph-line-weight" })}
              labelPosition="side"
              wrapperCss={{ width: "28ch" }}
              value={settings.graphLineWeight}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  graphLineWeight: e.currentTarget.value as GraphLineWeight,
                })
              }
            >
              {options.graphLineWeight}
            </NativeSelectField>
            <VStack alignItems="flex-start" w="full">
              <Text>
                <FormattedMessage id="graph-preview" />
              </Text>
              {/* The AspectRatio pattern's `&>*` child selector loses to
                  RecordingGraph's own position style, so this uses the same
                  ::before percentage-padding spacer and positions the graph
                  via its own props. */}
              <Box
                w="full"
                position="relative"
                _before={{
                  content: '""',
                  display: "block",
                  height: 0,
                  paddingBottom: `${(92 / 526) * 100}%`,
                }}
              >
                <RecordingGraph
                  responsive
                  data={previewGraphData}
                  role="img"
                  position="absolute"
                  inset={0}
                  w="full"
                  h="full"
                  aria-label={intl.formatMessage({
                    id: "recording-graph-label",
                  })}
                />
              </Box>
            </VStack>
            {showAnalyticsToggle && (
              // The w-full Box keeps the row spanning the dialog: the VStack
              // is alignItems flex-start, and Switch's helperText wrapper has
              // no width of its own.
              <Box w="full">
                <Switch
                  isSelected={settings.analyticsConsent === "granted"}
                  onChange={(granted) => {
                    setSettings({
                      analyticsConsent: granted ? "granted" : "denied",
                    });
                    logging.setConsent(granted);
                  }}
                  labelPosition="start"
                  helperText={
                    <FormattedMessage id="analytics-consent-setting-helper" />
                  }
                >
                  <FormattedMessage id="analytics-consent-setting-label" />
                </Switch>
              </Box>
            )}
            <Box w="full">
              <Button variant="link" onPress={handleResetToDefault}>
                <FormattedMessage id="restore-defaults-action" />
              </Button>
              <FieldHelperText>
                <FormattedMessage id="restore-defaults-helper" />
              </FieldHelperText>
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
