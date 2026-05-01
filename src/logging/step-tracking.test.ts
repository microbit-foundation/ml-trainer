/**
 * (c) 2026, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { describe, expect, it } from "vitest";
import { DataConnectionEvent } from "../data-connection-flow/data-connection-machine-common";
import { DataConnectionType } from "../data-connection-flow/data-connection-types";
import { DownloadEvent } from "../download-flow/download-machine-common";
import { MockLogging } from "./mock";
import { logConnectionTransition, logFlashTransition } from "./step-tracking";

describe("logConnectionTransition", () => {
  it("does not emit on a same-step self-transition", () => {
    const logging = new MockLogging();
    logConnectionTransition(
      logging,
      "Start",
      "Start",
      { type: "next" } as DataConnectionEvent,
      DataConnectionType.WebBluetooth
    );
    expect(logging.events).toEqual([]);
  });

  it("emits success and nothing else when entering Connected", () => {
    const logging = new MockLogging();
    logConnectionTransition(
      logging,
      "ConnectingMicrobits",
      "Connected",
      { type: "deviceConnected" } as DataConnectionEvent,
      DataConnectionType.NativeBluetooth
    );
    expect(logging.events).toEqual([
      {
        type: "device_connect_success",
        detail: { flow: "native_bluetooth" },
      },
    ]);
  });

  it("emits failure with code, alongside the step into the failure screen", () => {
    const logging = new MockLogging();
    logConnectionTransition(
      logging,
      "ConnectingMicrobits",
      "ConnectFailed",
      { type: "connectFlashFailure", code: "device-in-use" },
      DataConnectionType.WebBluetooth
    );
    expect(logging.events).toEqual([
      {
        type: "device_connect_failure",
        detail: {
          stage: "connect",
          code: "device-in-use",
          flow: "web_bluetooth",
        },
      },
      {
        type: "device_connect_step",
        detail: {
          step: "connect_failed",
          from: "connecting_microbits",
          via: "connectFlashFailure",
          flow: "web_bluetooth",
        },
      },
    ]);
  });

  it("falls back to code: 'unknown' when failure event has no code", () => {
    const logging = new MockLogging();
    logConnectionTransition(
      logging,
      "BluetoothConnect",
      "ConnectFailed",
      { type: "flashFailure" },
      DataConnectionType.Radio
    );
    expect(logging.events[0]).toEqual({
      type: "device_connect_failure",
      detail: { stage: "flash", code: "unknown", flow: "radio" },
    });
  });

  it("maps connectDataFailure to stage: 'data'", () => {
    const logging = new MockLogging();
    logConnectionTransition(
      logging,
      "Connected",
      "ConnectionLost",
      { type: "connectDataFailure", code: "pairing-information-lost" },
      DataConnectionType.NativeBluetooth
    );
    expect(
      logging.events.find((e) => e.type === "device_connect_failure")
    ).toEqual({
      type: "device_connect_failure",
      detail: {
        stage: "data",
        code: "pairing-information-lost",
        flow: "native_bluetooth",
      },
    });
  });

  it("emits device_disconnect alongside the step when entering ConnectionLost", () => {
    const logging = new MockLogging();
    logConnectionTransition(
      logging,
      "Connected",
      "ConnectionLost",
      { type: "deviceDisconnected" } as DataConnectionEvent,
      DataConnectionType.WebBluetooth
    );
    expect(logging.events).toEqual([
      {
        type: "device_disconnect",
        detail: { reason: "unknown", flow: "web_bluetooth" },
      },
      {
        type: "device_connect_step",
        detail: {
          step: "connection_lost",
          // Connected maps to undefined, so `from` falls back to "idle".
          from: "idle",
          via: "deviceDisconnected",
          flow: "web_bluetooth",
        },
      },
    ]);
  });

  it("emits exit when the user closes the dialog mid-flow", () => {
    const logging = new MockLogging();
    logConnectionTransition(
      logging,
      "EnterBluetoothPattern",
      "Idle",
      { type: "close" },
      DataConnectionType.NativeBluetooth
    );
    expect(logging.events).toEqual([
      {
        type: "device_connect_exit",
        detail: {
          at_step: "enter_bluetooth_pattern",
          reason: "close",
          flow: "native_bluetooth",
        },
      },
    ]);
  });

  it("does not emit exit when leaving Idle to a transient state (oldName undefined)", () => {
    const logging = new MockLogging();
    // Connected → Idle is post-success cleanup, not a user exit.
    logConnectionTransition(
      logging,
      "Connected",
      "Idle",
      { type: "close" },
      DataConnectionType.WebBluetooth
    );
    expect(logging.events).toEqual([]);
  });

  it("does not emit a step event when newStep maps to undefined", () => {
    const logging = new MockLogging();
    // WebUsbChooseMicrobit is a transient OS picker; intentionally filtered.
    logConnectionTransition(
      logging,
      "WebUsbFlashingTutorial",
      "WebUsbChooseMicrobit",
      { type: "next" } as DataConnectionEvent,
      DataConnectionType.WebBluetooth
    );
    expect(logging.events).toEqual([]);
  });

  it("emits a normal step event with from/via/flow and substitutes 'idle' for an undefined oldName", () => {
    const logging = new MockLogging();
    logConnectionTransition(
      logging,
      "Idle",
      "Start",
      { type: "connect" } as DataConnectionEvent,
      DataConnectionType.Radio
    );
    expect(logging.events).toEqual([
      {
        type: "device_connect_step",
        detail: {
          step: "start",
          from: "idle",
          via: "connect",
          flow: "radio",
        },
      },
    ]);
  });
});

describe("logFlashTransition", () => {
  it("does not emit on a same-step self-transition", () => {
    const logging = new MockLogging();
    logFlashTransition(
      logging,
      "Help",
      "Help",
      { type: "next" } as DownloadEvent,
      "browser-default"
    );
    expect(logging.events).toEqual([]);
  });

  it("emits failure with code alongside the step into the failure screen", () => {
    const logging = new MockLogging();
    logFlashTransition(
      logging,
      "FlashingInProgress",
      "ConnectFailed",
      { type: "flashFailure", code: "device-disconnected" },
      "radio"
    );
    expect(logging.events).toEqual([
      {
        type: "device_flash_failure",
        detail: { stage: "flash", code: "device-disconnected", flow: "radio" },
      },
      {
        type: "device_flash_step",
        detail: {
          step: "connect_failed",
          from: "flashing",
          via: "flashFailure",
          flow: "radio",
        },
      },
    ]);
  });

  it("falls back to code: 'unknown' on a failure event without a code", () => {
    const logging = new MockLogging();
    logFlashTransition(
      logging,
      "ConnectCable",
      "ConnectFailed",
      { type: "connectFlashFailure" },
      "browser-default"
    );
    expect(logging.events[0]).toEqual({
      type: "device_flash_failure",
      detail: { stage: "connect", code: "unknown", flow: "web_bluetooth" },
    });
  });

  it("emits exit on close from a meaningful step", () => {
    const logging = new MockLogging();
    logFlashTransition(
      logging,
      "ChooseSameOrDifferentMicrobit",
      "None",
      { type: "close" },
      "nativeBluetooth"
    );
    expect(logging.events).toEqual([
      {
        type: "device_flash_exit",
        detail: {
          at_step: "choose_microbit",
          reason: "close",
          flow: "native_bluetooth",
        },
      },
    ]);
  });

  it("emits a normal step event with from/via/flow", () => {
    const logging = new MockLogging();
    logFlashTransition(
      logging,
      "Help",
      "ChooseSameOrDifferentMicrobit",
      { type: "next" } as DownloadEvent,
      "browser-default"
    );
    expect(logging.events).toEqual([
      {
        type: "device_flash_step",
        detail: {
          step: "choose_microbit",
          from: "help",
          via: "next",
          flow: "web_bluetooth",
        },
      },
    ]);
  });
});
