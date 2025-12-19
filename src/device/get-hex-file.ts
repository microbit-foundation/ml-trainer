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

import hexV1NoPairing from "./firmware/microbit-data-collection-no-pairing-v1.hex";
import hexV2NoPairing from "./firmware/microbit-data-collection-no-pairing-v2.hex";
import hexUniversalNoPairing from "./firmware/microbit-data-collection-no-pairing-universal.hex";

import hexV1JustWorks from "./firmware/microbit-data-collection-just-works-v1.hex";
import hexV2JustWorks from "./firmware/microbit-data-collection-just-works-v2.hex";
import hexUniversalJustWorks from "./firmware/microbit-data-collection-just-works-universal.hex";

import hexRadioRemoteDev from "./firmware/radio-remote-v0.2.1-dev.hex";
import hexRadioRemote from "./firmware/radio-remote-v0.2.1.hex";
import hexRadioBridge from "./firmware/radio-bridge-v0.2.1.hex";
import hexRadioLocal from "./firmware/local-sensors-v0.2.1.hex";
import { Capacitor } from "@capacitor/core";

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
    if (Capacitor.isNativePlatform()) {
      return {
        V1: hexV1JustWorks,
        V2: hexV2JustWorks,
        universal: hexUniversalJustWorks,
      }[version];
    } else {
      return {
        V1: hexV1NoPairing,
        V2: hexV2NoPairing,
        universal: hexUniversalNoPairing,
      }[version];
    }
  }
  if (version !== "V2") {
    return undefined;
  }
  return {
    "radio-remote-dev": hexRadioRemoteDev,
    "radio-remote": hexRadioRemote,
    "radio-bridge": hexRadioBridge,
    "radio-local": hexRadioLocal,
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
