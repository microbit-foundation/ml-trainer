/**
 * (c) 2024, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { useStorage } from "./use-storage";

export interface StoredConnectionConfig {
  bluetoothMicrobitName?: string;
}

export const useConnectionConfigStorage = () => {
  return useStorage<StoredConnectionConfig>("local", "connectionConfig", {
    bluetoothMicrobitName: undefined,
  });
};
