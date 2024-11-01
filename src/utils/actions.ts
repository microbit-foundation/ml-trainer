import { ActionData } from "../model";

export const getTotalNumSamples = (actions: ActionData[]) =>
  actions.map((g) => g.recordings).reduce((acc, curr) => acc + curr.length, 0);
