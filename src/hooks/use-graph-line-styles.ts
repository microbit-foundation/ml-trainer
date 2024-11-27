import { GraphLineScheme } from "../settings";

export interface GraphLineStyles {
  x: undefined | string;
  y: undefined | string;
  z: undefined | string;
}

export const useGraphLineStyles = (
  graphLineScheme: GraphLineScheme
): GraphLineStyles => {
  switch (graphLineScheme) {
    case "accessible": {
      return {
        x: undefined,
        y: "10,5",
        z: "2,2",
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
};

export const graphLineStyleStringToArray = (value: string | undefined) =>
  value
    ? (value.split(",").map((x) => Number(x)) as [number, number])
    : undefined;
