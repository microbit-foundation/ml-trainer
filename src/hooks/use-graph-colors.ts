/**
 * (c) 2024, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { GraphColorScheme } from "../settings";

export const useGraphColors = (graphColorScheme: GraphColorScheme) => {
  switch (graphColorScheme) {
    case "color-blind-1": {
      return {
        x: "rgb(42, 146, 214)",
        y: "rgb(205, 3, 101)",
        z: "rgb(0, 0, 0)",
      };
    }
    case "color-blind-2": {
      return {
        x: "rgb(42, 146, 214)",
        y: "rgb(0, 160, 0)",
        z: "rgb(0, 0, 0)",
      };
    }
    default: {
      return {
        x: "rgb(255, 68, 68)",
        y: "rgb(29, 157, 29)",
        z: "rgb(0, 0, 191)",
      };
    }
  }
};
