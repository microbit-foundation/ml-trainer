import { ActionData } from "./model";
import { StoreAction } from "./storage";

export const prepActionForStorage = (action: ActionData): StoreAction => {
  return {
    ID: action.ID,
    name: action.name,
    icon: action.icon,
    requiredConfidence: action.requiredConfidence,
    recordingIds: action.recordings.map((r) => r.ID.toString()),
  };
};
