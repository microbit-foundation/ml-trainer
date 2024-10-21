import { GestureData } from "../model";

export const getTotalNumSamples = (gestures: GestureData[]) =>
  gestures.map((g) => g.recordings).reduce((acc, curr) => acc + curr.length, 0);
