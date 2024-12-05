/**
 * (c) 2023, Center for Computational Thinking and Design at Aarhus University and contributors
 * Modifications (c) 2024, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import {
  BoardVersion,
  FlashDataError,
  FlashDataSource,
} from "@microbit/microbit-connection";

export enum HexType {
  RadioRemote = "radio-remote",
  RadioBridge = "radio-bridge",
  Bluetooth = "bluetooth",
  RadioRemoteDev = "radio-remote-dev",
  RadioLocal = "radio-local",
}
export const getHexFileUrl = (
  version: BoardVersion | "universal",
  type: HexType
): string | undefined => {
  if (type === HexType.Bluetooth) {
    return {
      V1: "firmware/ml-microbit-cpp-version-combined.hex",
      V2: "firmware/MICROBIT.hex",
      universal: "firmware/universal-hex.hex",
    }[version];
  }
  if (version !== "V2") {
    return undefined;
  }
  return {
    "radio-remote-dev": "firmware/radio-remote-v0.2.1-dev.hex",
    "radio-remote": "firmware/radio-remote-v0.2.1.hex",
    "radio-bridge": "firmware/radio-bridge-v0.2.1.hex",
    "radio-local": "firmware/local-sensors-v0.2.1.hex",
  }[type];
};

export const getFlashDataSource = (hex: HexType): FlashDataSource => {
  return async (boardVersion: BoardVersion) => {
    const url = getHexFileUrl(boardVersion, hex);
    if (!url) {
      throw new FlashDataError("No hex for board version");
    }
    const response = await fetch(url);
    if (!response.ok) {
      throw new FlashDataError(`Failed to fetch ${response.status}`);
    }
    return response.text();
  };
};
