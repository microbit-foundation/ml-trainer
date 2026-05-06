/**
 * (c) 2026, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { DataConnectionEvent } from "../data-connection-flow/data-connection-machine-common";
import {
  DataConnectionStep,
  DataConnectionType,
} from "../data-connection-flow/data-connection-types";
import { DownloadEvent } from "../download-flow/download-machine-common";
import { DownloadFlowType } from "../download-flow/download-machine";
import { DownloadStep } from "../download-flow/download-types";
import { Logging } from "./logging";

/**
 * The user-mode descriptor: which transport stack the user's hardware
 * setup uses end-to-end. `web_bluetooth` and `native_bluetooth`
 * differentiate platforms because their connection codepaths and
 * failure modes differ; `radio` covers the radio-bridge flow.
 *
 * For events emitted from the download state machine the actual flash
 * happens over WebUSB / native USB regardless of this value — the
 * dimension is the user's overall setup, not the per-event transport.
 */
export type AnalyticsTransport = "web_bluetooth" | "native_bluetooth" | "radio";

/**
 * Which user-goal-driven state machine the event came from.
 * `data_connection` = connecting a micro:bit so the app can read live
 * sensor data (recording, predictions). `download` = flashing the
 * user's program to a micro:bit.
 */
export type AnalyticsTask = "data_connection" | "download";

export const dataConnectionTypeToAnalyticsTransport = (
  type: DataConnectionType
): AnalyticsTransport => {
  switch (type) {
    case DataConnectionType.WebBluetooth:
      return "web_bluetooth";
    case DataConnectionType.NativeBluetooth:
      return "native_bluetooth";
    case DataConnectionType.Radio:
      return "radio";
  }
};

export const downloadFlowTypeToAnalyticsTransport = (
  type: DownloadFlowType
): AnalyticsTransport => {
  switch (type) {
    case "browser-default":
      return "web_bluetooth";
    case "nativeBluetooth":
      return "native_bluetooth";
    case "radio":
      return "radio";
  }
};

/**
 * Stable analytics step names for the data-connection state machine.
 *
 * The lookup decouples the analytics dimension from the state-machine
 * state names, so refactoring states (rename, split, merge) doesn't move
 * GA4 dashboards. States that map to `undefined` are filtered out — they
 * are bounded by a more specific terminal event (Connected →
 * device_success) or have no honest funnel value (e.g.
 * WebUsbBluetoothUnsupported, where there's no transport to attribute).
 *
 * If a new state is added to DataConnectionStep without an entry here,
 * the `Record<DataConnectionStep, …>` shape will fail compilation —
 * forcing an explicit decision rather than silent omission.
 */
const connectStepNames: Record<DataConnectionStep, string | undefined> = {
  Idle: undefined,
  Connected: undefined,
  Start: "start",
  ConnectCable: "connect_cable",
  WebUsbFlashingTutorial: "webusb_flashing_tutorial",
  ConnectBattery: "connect_battery",
  EnterBluetoothPattern: "enter_bluetooth_pattern",
  NativeBluetoothPreConnectTutorial: "native_bluetooth_tutorial",
  WebBluetoothPreConnectTutorial: "webbluetooth_tutorial",
  WebUsbChooseMicrobit: "webusb_choose_microbit",
  BluetoothConnect: "bluetooth_connecting",
  ConnectingMicrobits: "connecting_microbits",
  FlashingInProgress: "flashing",
  NativeBluetoothPreConnectTroubleshooting: "native_bluetooth_troubleshooting",
  TryAgainReplugMicrobit: "try_again_replug",
  TryAgainCloseTabs: "try_again_close_tabs",
  TryAgainWebUsbSelectMicrobit: "try_again_webusb_select",
  TryAgainBluetoothSelectMicrobit: "try_again_bluetooth_select",
  ConnectFailed: "connect_failed",
  PairingLost: "pairing_lost",
  BadFirmware: "bad_firmware",
  MicrobitUnsupported: "microbit_unsupported",
  // No transport possible — there's no funnel through this terminal
  // screen. The cohort is captured by the webusb_available /
  // webbluetooth_available user properties; emitting step / exit
  // events here would have no honest `transport` value.
  WebUsbBluetoothUnsupported: undefined,
  ManualFlashingTutorial: "manual_flashing_tutorial",
  ConnectionLost: "connection_lost",
  StartOver: "start_over",
  BluetoothDisabled: "bluetooth_disabled",
  BluetoothPermissionDenied: "bluetooth_permission_denied",
  LocationDisabled: "location_disabled",
};

/**
 * Emit step / exit / success / failure events for a data-connection
 * state machine transition. Called from `sendEvent` after the transition
 * resolves and the new state has been applied. Intentionally a thin
 * mapper — the source of truth for "what state are we in?" stays the
 * machine; this just translates state changes to GA4-shaped events.
 */
export const logConnectionTransition = (
  logging: Logging,
  oldStep: DataConnectionStep,
  newStep: DataConnectionStep,
  event: DataConnectionEvent,
  type: DataConnectionType
): void => {
  if (oldStep === newStep) {
    return;
  }

  const oldName = connectStepNames[oldStep];
  const newName = connectStepNames[newStep];
  const transport = dataConnectionTypeToAnalyticsTransport(type);
  const task: AnalyticsTask = "data_connection";

  // Terminal success: bounds the funnel without an extra step event for
  // Connected (which is just "the dialog closed and we're using the
  // device").
  if (newStep === "Connected") {
    logging.event({
      type: "device_success",
      detail: { task, transport },
    });
    return;
  }

  // Terminal failure: emit alongside the step into the failure screen,
  // so the failure-rate analysis is one query without joining step
  // events to event payloads. `at_step` carries the step the user was
  // on when the SDK reported the failure.
  if (
    event.type === "connectFlashFailure" ||
    event.type === "flashFailure" ||
    event.type === "connectDataFailure"
  ) {
    logging.event({
      type: "device_failure",
      detail: {
        task,
        at_step: oldName ?? "unknown",
        code: event.code ?? "unknown",
        transport,
      },
    });
  }

  // Unexpected disconnect: only emit when the user actually sees the
  // ConnectionLost screen — brief auto-reconnects don't trip this.
  // Pairs with the user-initiated `device_disconnect` from the
  // LiveGraphPanel button (reason: "user"). No `task` param: disconnect
  // is always from the data-connection state machine.
  if (newStep === "ConnectionLost") {
    logging.event({
      type: "device_disconnect",
      detail: { reason: "unknown", transport },
    });
  }

  // Exit: user closed the connect dialog mid-flow. Goes to Idle, but
  // only if we were on a user-meaningful step (otherwise it's
  // background flow plumbing).
  if (newStep === "Idle" && oldName !== undefined) {
    if (event.type === "close") {
      logging.event({
        type: "device_exit",
        detail: { task, at_step: oldName, reason: "close", transport },
      });
    }
    // event.type === "disconnect" is the user-initiated disconnect — the
    // LiveGraphPanel already logged that as device_disconnect. Other
    // Idle transitions (post-success cleanup) are not user exits.
    return;
  }

  // Standard step entry — only when the new state is user-meaningful.
  if (newName !== undefined) {
    logging.event({
      type: "device_step",
      detail: {
        task,
        step: newName,
        from: oldName ?? "idle",
        via: event.type,
        transport,
      },
    });
  }
};

/**
 * Stable analytics step names for the download/flash state machine.
 * Same shape and rules as `connectStepNames`.
 */
const flashStepNames: Record<DownloadStep, string | undefined> = {
  None: undefined,
  Help: "help",
  ChooseSameOrDifferentMicrobit: "choose_microbit",
  ConnectCable: "connect_cable",
  WebUsbFlashingTutorial: "webusb_flashing_tutorial",
  ConnectRadioRemoteMicrobit: "connect_radio_remote",
  ManualFlashingTutorial: "manual_flashing_tutorial",
  EnterBluetoothPattern: "enter_bluetooth_pattern",
  NativeBluetoothPreConnectTutorial: "native_bluetooth_tutorial",
  NativeBluetoothPreConnectTroubleshooting: "native_bluetooth_troubleshooting",
  PairingLost: "pairing_lost",
  BluetoothSearchConnect: "bluetooth_searching",
  FlashingInProgress: "flashing",
  IncompatibleDevice: "incompatible_device",
  ConnectFailed: "connect_failed",
  UnplugRadioBridgeMicrobit: "unplug_radio_bridge",
  BluetoothDisabled: "bluetooth_disabled",
  BluetoothPermissionDenied: "bluetooth_permission_denied",
  LocationDisabled: "location_disabled",
};

/**
 * Download/flash flow analogue of `logConnectionTransition`. Emits
 * device_step / device_exit / device_failure with `task: "download"`.
 * The terminal `device_success` for this task is logged from
 * `performFlash` itself with the actions/samples context that's only
 * available there.
 */
export const logFlashTransition = (
  logging: Logging,
  oldStep: DownloadStep,
  newStep: DownloadStep,
  event: DownloadEvent,
  flowType: DownloadFlowType
): void => {
  if (oldStep === newStep) {
    return;
  }

  const oldName = flashStepNames[oldStep];
  const newName = flashStepNames[newStep];
  const transport = downloadFlowTypeToAnalyticsTransport(flowType);
  const task: AnalyticsTask = "download";

  if (event.type === "connectFlashFailure" || event.type === "flashFailure") {
    logging.event({
      type: "device_failure",
      detail: {
        task,
        at_step: oldName ?? "unknown",
        code: event.code ?? "unknown",
        transport,
      },
    });
  }

  if (newStep === "None" && oldName !== undefined) {
    if (event.type === "close") {
      logging.event({
        type: "device_exit",
        detail: { task, at_step: oldName, reason: "close", transport },
      });
    }
    return;
  }

  if (newName !== undefined) {
    logging.event({
      type: "device_step",
      detail: {
        task,
        step: newName,
        from: oldName ?? "idle",
        via: event.type,
        transport,
      },
    });
  }
};
