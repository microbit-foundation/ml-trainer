// TODO: To remove file after icon is included in Gesture
import { GestureData as TempGesture } from "../gestures-hooks";

// TODO: To be removed once gesture has icon name as property
export interface Gesture extends TempGesture {
  icon: string;
}

// TODO: Temporary transformation to include icon
export const addIconToGestures = (gestures: TempGesture[]): Gesture[] => {
  return gestures.map((g) => ({ ...g, icon: "heart" }));
};
