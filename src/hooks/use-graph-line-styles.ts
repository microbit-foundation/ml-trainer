import { useMemo } from "react";
import { GraphLineScheme } from "../settings";

export interface GraphLineStyles {
  x: undefined | number[];
  y: undefined | number[];
  z: undefined | number[];
}

export const useGraphLineStyles = (
  graphLineScheme: GraphLineScheme
): GraphLineStyles => {
  return useMemo(() => {
    switch (graphLineScheme) {
      case "accessible": {
        return {
          x: undefined,
          y: [10, 5],
          z: [2, 2],
        };
      }
      default: {
        return {
          x: undefined,
          y: undefined,
          z: undefined,
        };
      }
    }
  }, [graphLineScheme]);
};
