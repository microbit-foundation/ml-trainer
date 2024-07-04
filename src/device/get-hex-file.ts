import { ConnType } from "../connection-flow";
import { MicrobitVersion } from "./device";

export const getHexFileUrl = (
  version: MicrobitVersion | "universal",
  type: ConnType | "radio-remote-dev" | "radio-local"
): string | undefined => {
  if (type === ConnType.Bluetooth) {
    return {
      1: "firmware/ml-microbit-cpp-version-combined.hex",
      2: "firmware/MICROBIT.hex",
      universal: "firmware/universal-hex.hex",
    }[version];
  }
  if (version !== 2) {
    return undefined;
  }
  return {
    "radio-remote-dev": "firmware/radio-remote-v0.2.1-dev.hex",
    [ConnType.RadioRemote]: "firmware/radio-remote-v0.2.1.hex",
    [ConnType.RadioBridge]: "firmware/radio-bridge-v0.2.1.hex",
    "radio-local": "firmware/local-sensors-v0.2.1.hex",
  }[type];
};
