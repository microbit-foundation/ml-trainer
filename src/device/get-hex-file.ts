import {
  BoardVersion,
  FlashDataError,
  FlashDataSource,
} from "@microbit/microbit-connection";

import hexV1 from "./firmware/ml-microbit-cpp-version-combined.hex";
import hexV2 from "./firmware/MICROBIT.hex";
import hexUniversal from "./firmware/universal-hex.hex";
import hexRadioRemoteDev from "./firmware/radio-remote-v0.2.1-dev.hex";
import hexRadioRemote from "./firmware/radio-remote-v0.2.1.hex";
import hexRadioBridge from "./firmware/radio-bridge-v0.2.1.hex";
import hexRadioLocal from "./firmware/local-sensors-v0.2.1.hex";

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
      V1: hexV1,
      V2: hexV2,
      universal: hexUniversal,
    }[version];
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
