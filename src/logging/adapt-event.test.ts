/**
 * (c) 2026, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { describe, expect, it, vi } from "vitest";
import { adaptEvent } from "./adapt-event";

describe("adaptEvent", () => {
  it("boot no WebUSB and no WebBluetooth", () => {
    expect(
      adaptEvent({
        type: "boot",
        detail: { bluetoothAvailable: false },
      })
    ).toEqual([
      { type: "WebUSB-available", message: "no" },
      { type: "WebBluetooth-available", message: "no" },
    ]);
  });

  it("boot with WebUSB and WebBluetooth", () => {
    vi.stubGlobal("navigator", { usb: { fake: "implementation" } });
    try {
      expect(
        adaptEvent({
          type: "boot",
          detail: { bluetoothAvailable: true },
        })
      ).toEqual([
        { type: "WebUSB-available", message: "yes" },
        { type: "WebBluetooth-available", message: "yes" },
      ]);
    } finally {
      vi.unstubAllGlobals();
    }
  });

  for (const type of ["drop-load", "file-upload"]) {
    it(type, () => {
      expect(
        adaptEvent({
          type,
          detail: { extension: "hex" },
        })
      ).toEqual([{ type: "load", message: `${type}-hex` }]);

      expect(
        adaptEvent({
          type,
          detail: { extension: "json" },
        })
      ).toEqual([{ type: "load", message: `${type}-json` }]);
    });
  }

  for (const type of [
    "hex-download",
    "hex-save",
    "dataset-save",
    "model-train",
  ]) {
    it(type, () => {
      expect(
        adaptEvent({
          type,
          detail: { actions: 2, samples: 5 },
        })
      ).toEqual([
        { type },
        { type: `${type}-actions`, value: 2 },
        { type: `${type}-samples`, message: "0-5" },
      ]);

      expect(
        adaptEvent({
          type,
          detail: { actions: 4, samples: 40 },
        })
      ).toEqual([
        { type },
        { type: `${type}-actions`, value: 4 },
        { type: `${type}-samples`, message: "31-49" },
      ]);
    });
  }

  it("unknown", () => {
    expect(
      adaptEvent({
        type: "nonsense",
        message: "hello",
        value: 99,
      })
    ).toEqual([
      {
        type: "nonsense",
        message: "hello",
        value: 99,
      },
    ]);
  });
});
