import { ConnectionFlowType } from "../connection-stage-hooks";
import {
  BoardVersion,
  FlashDataError,
  FlashDataSource,
} from "@microbit/microbit-connection";

export const getHexFileUrl = (
  version: BoardVersion | "universal",
  type: ConnectionFlowType | "radio-remote-dev" | "radio-local"
): string | undefined => {
  if (type === ConnectionFlowType.Bluetooth) {
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
    [ConnectionFlowType.RadioRemote]: "firmware/radio-remote-v0.2.1.hex",
    [ConnectionFlowType.RadioBridge]: "firmware/radio-bridge-v0.2.1.hex",
    "radio-local": "firmware/local-sensors-v0.2.1.hex",
  }[type];
};

export const getFlashDataSource = (
  type: ConnectionFlowType | "radio-remote-dev" | "radio-local"
): FlashDataSource => {
  return async (boardVersion: BoardVersion) => {
    const url = getHexFileUrl(boardVersion, type);
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
