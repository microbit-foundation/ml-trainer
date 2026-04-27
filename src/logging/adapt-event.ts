/**
 * (c) 2026, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { Event } from "./logging";

interface BootDetail {
  bluetoothAvailable: boolean;
}

interface ExtensionDetail {
  extension: string;
}

interface ActionsSamplesDetail {
  actions: number;
  samples: number;
}

/**
 * Adapt our internal event interface to one or more events for GA.
 */
export const adaptEvent = (event: Event): Event[] => {
  switch (event.type) {
    case "boot": {
      const { bluetoothAvailable } = event.detail as BootDetail;
      return [checkWebUSB(), checkWebBluetooth(bluetoothAvailable)];
    }
    case "drop-load": {
      const { extension } = event.detail as ExtensionDetail;
      return [
        {
          type: "load",
          message: `drop-load-${extension}`,
        },
      ];
    }
    case "file-upload": {
      const { extension } = event.detail as ExtensionDetail;
      return [
        {
          type: "load",
          message: `file-upload-${extension}`,
        },
      ];
    }
    case "hex-download":
    case "hex-save":
    case "dataset-save":
    case "model-train": {
      const { actions, samples } = event.detail as ActionsSamplesDetail;
      return [
        { type: event.type },
        metricActions(event.type, actions),
        metricSamples(event.type, samples),
      ];
    }
    default: {
      return [event];
    }
  }
};

const checkWebUSB = (): Event => ({
  type: "WebUSB-available",
  message: "usb" in navigator ? "yes" : "no",
});

const checkWebBluetooth = (bluetoothAvailable: boolean): Event => ({
  type: "WebBluetooth-available",
  message: bluetoothAvailable ? "yes" : "no",
});

const metricActions = (type: string, actions: number): Event => ({
  type: `${type}-actions`,
  value: actions,
});

const metricSamples = (type: string, samples: number): Event => {
  const range = [
    [0, 5],
    [6, 10],
    [11, 15],
    [16, 20],
    [21, 30],
    [31, 49],
    [50, 99],
    [100, 199],
    [200, 499],
    [500, 1000],
  ];
  const bucket = range.filter((a) => samples >= a[0] && samples <= a[1]);
  const message = bucket.toString().replace(/,/g, "-");
  return {
    type: `${type}-samples`,
    message,
  };
};
